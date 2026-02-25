import React, { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import RichTextEditor from '../../components/RichTextEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import { useCustomPageTitle } from '../../hooks/usePageTitle';
import type { User } from '../../types';

interface WikiPageData {
  WikiPageID: number;
  Slug: string;
  Title: string;
  Content: string;
  LastModified: string;
  ModifiedByUserID: number;
  CreatedByUserID: number;
  IsHandbook: boolean;
  ModifiedByUsername: string;
  CreatedByUsername: string;
}

const UserWikiPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useOutletContext<{ user?: User }>();
  const navigate = useNavigate();
  
  const [pageData, setPageData] = useState<WikiPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isModerator = user?.isModerator || user?.isAdmin;
  const isCreator = pageData?.CreatedByUserID === user?.id;
  const canEdit = user && !pageData?.IsHandbook; // Any logged-in user can edit user pages
  const canDelete = isCreator || isModerator;
  useCustomPageTitle(pageData?.Title);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      
      try {
        const response = await fetch(`/api/wiki/${slug}`);
        if (response.ok) {
          const data = await response.json();
          // If it's a handbook page, redirect to the static page
          if (data.IsHandbook) {
            navigate(`/wiki/${slug}`, { replace: true });
            return;
          }
          setPageData(data);
          setEditContent(data.Content || '');
          setEditTitle(data.Title || '');
          setCodeContent(data.Content || '');
        } else if (response.status === 404) {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching wiki page:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [slug, navigate]);

  const handleModeSwitch = (mode: 'visual' | 'code') => {
    if (mode === 'code' && editMode === 'visual') {
      setCodeContent(editContent);
    } else if (mode === 'visual' && editMode === 'code') {
      setEditContent(codeContent);
    }
    setEditMode(mode);
  };

  const handleSave = async () => {
    if (!slug || !user) return;
    
    setSaving(true);
    try {
      const contentToSave = editMode === 'code' ? codeContent : editContent;
      const response = await fetch(`/api/wiki/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: contentToSave,
          userId: user.id,
          isModerator: isModerator
        })
      });

      if (response.ok) {
        setPageData(prev => prev ? {
          ...prev,
          Title: editTitle,
          Content: contentToSave,
          ModifiedByUsername: user.username || ''
        } : null);
        setIsEditing(false);
      } else {
        const error = await response.text();
        alert('Error saving: ' + error);
      }
    } catch (error) {
      console.error('Error saving wiki page:', error);
      alert('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !user) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/wiki/${slug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isModerator: isModerator
        })
      });

      if (response.ok) {
        navigate('/wiki/title-list');
      } else {
        const error = await response.text();
        alert('Error deleting: ' + error);
      }
    } catch (error) {
      console.error('Error deleting wiki page:', error);
      alert('Error deleting page');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    setEditContent(pageData?.Content || '');
    setEditTitle(pageData?.Title || '');
    setCodeContent(pageData?.Content || '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        </div>
        <div className="px-6 py-6">
          <nav className="text-xs mb-2 text-gray-600">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <Link to="/wiki/title-list" className="hover:underline">Wiki</Link>
            <span className="mx-2">›</span>
            <span>Not Found</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-sm text-gray-600 mb-4">This wiki page doesn't exist.</p>
          <Link to="/wiki/title-list" className="text-sm text-[#2f3a2f] hover:underline">
            ← Back to Wiki
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex items-center justify-between">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        <div className="flex items-center gap-3">
          {canDelete && !isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-300 hover:text-red-100"
            >
              Delete
            </button>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-white/70 hover:text-white"
            >
              Edit Page
            </button>
          )}
        </div>
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/title-list" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>{pageData?.Title}</span>
        </nav>

        {isEditing ? (
          <>
            {/* Title editor */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Page Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
              />
            </div>

            {/* Mode toggle */}
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => handleModeSwitch('visual')}
                className={`px-3 py-1 text-xs ${editMode === 'visual' ? 'bg-[#2f3a2f] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Visual
              </button>
              <button
                onClick={() => handleModeSwitch('code')}
                className={`px-3 py-1 text-xs ${editMode === 'code' ? 'bg-[#2f3a2f] text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Code
              </button>
            </div>

            {/* Editor */}
            {editMode === 'visual' ? (
              <div className="wiki-editor-container border border-gray-300 mb-4">
                <RichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Write your wiki page content..."
                />
              </div>
            ) : (
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                className="w-full h-96 border border-gray-300 p-3 font-mono text-xs text-gray-900 mb-4 focus:outline-none focus:border-[#2f3a2f]"
                placeholder="<p>Write your HTML content here...</p>"
              />
            )}

            {/* Save/Cancel buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#2f3a2f] text-white text-xs hover:bg-[#3d4a3d] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-6">{pageData?.Title}</h1>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Content */}
              <div className="flex-1">
                <div 
                  className="wiki-content max-w-none text-gray-800 text-xs"
                  dangerouslySetInnerHTML={{ __html: pageData?.Content || '' }}
                />
                
                {/* Page info */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  <p>Created by: {pageData?.CreatedByUsername || 'Unknown'}</p>
                  {pageData?.LastModified && (
                    <p>Last modified: {new Date(pageData.LastModified).toLocaleDateString()} by {pageData.ModifiedByUsername || 'Unknown'}</p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:w-72">
                <WikiSearchBox />

                {/* Quick Links */}
                <div className="bg-white border border-stone-300">
                  <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                    Links
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      <li>
                        <Link to="/wiki/title-list" className="text-[#2f3a2f] hover:underline">All Wiki Pages</Link>
                      </li>
                      <li>
                        <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Handbook</Link>
                      </li>
                      <li>
                        <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">Game Overview</Link>
                      </li>
                      <li>
                        <Link to="/wiki/getting-started" className="text-[#2f3a2f] hover:underline">Getting Started</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md mx-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Wiki Page</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{pageData?.Title}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UserWikiPage;
