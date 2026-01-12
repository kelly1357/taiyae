import React, { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import RichTextEditor from '../../components/RichTextEditor';
import type { User } from '../../types';

interface UserWikiPage {
  WikiPageID: number;
  Slug: string;
  Title: string;
  CreatedByUsername: string;
}

const TitleList: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const navigate = useNavigate();
  
  const [userPages, setUserPages] = useState<UserWikiPage[]>([]);
  const [loadingUserPages, setLoadingUserPages] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageContent, setNewPageContent] = useState('');
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [codeContent, setCodeContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [slugError, setSlugError] = useState('');

  // Handbook pages (static list)
  const handbookPages = [
    { title: 'Absences and Scarcity', slug: 'absences-and-scarcity', isHandbook: true },
    { title: 'Achievements', slug: 'achievements', isHandbook: true },
    { title: 'Activity Checks', slug: 'activity-checks', isHandbook: true },
    { title: 'FAQ', slug: 'faq', isHandbook: true },
    { title: 'Game Overview', slug: 'game-overview', isHandbook: true },
    { title: 'Getting Started', slug: 'getting-started', isHandbook: true },
    { title: 'Handbook', slug: 'handbook', isHandbook: true },
    { title: 'Map', slug: 'map', isHandbook: true },
    { title: 'Offscreen Interactions', slug: 'offscreen-interactions', isHandbook: true },
    { title: 'Pack Creation', slug: 'pack-creation', isHandbook: true },
    { title: 'Profile Help', slug: 'profile-help', isHandbook: true },
    { title: 'Rules: Compilation', slug: 'rules-compilation', isHandbook: true },
    { title: 'Rules: General', slug: 'rules-general', isHandbook: true },
    { title: 'Rules: Mind Reading', slug: 'rules-mind-reading', isHandbook: true },
    { title: 'Setting Overview', slug: 'setting-overview', isHandbook: true },
    { title: 'Skill Points', slug: 'skill-points', isHandbook: true },
    { title: 'Spirit Symbols', slug: 'spirit-symbols', isHandbook: true },
    { title: 'Three Strike Rule', slug: 'three-strike-rule', isHandbook: true },
    { title: 'Using Tags', slug: 'using-tags', isHandbook: true },
    { title: 'Wolf Guide', slug: 'wolf-guide', isHandbook: true },
    { title: 'Wolf Guide: Fighting', slug: 'wolf-guide-fighting', isHandbook: true },
    { title: 'Wolf Guide: Pup Development', slug: 'wolf-guide-pup-development', isHandbook: true },
  ];

  // Fetch user-created pages
  useEffect(() => {
    const fetchUserPages = async () => {
      try {
        const response = await fetch('/api/wiki?handbook=false');
        if (response.ok) {
          const data = await response.json();
          setUserPages(data);
        }
      } catch (error) {
        console.error('Error fetching user wiki pages:', error);
      } finally {
        setLoadingUserPages(false);
      }
    };
    fetchUserPages();
  }, []);

  // Combine all pages
  const allPages = useMemo(() => {
    const combined = [
      ...handbookPages,
      ...userPages.map(p => ({ 
        title: p.Title, 
        slug: p.Slug, 
        isHandbook: false,
        createdBy: p.CreatedByUsername 
      }))
    ];
    return combined.sort((a, b) => a.title.localeCompare(b.title));
  }, [userPages]);

  // Group pages by first letter
  const groupedPages = useMemo(() => {
    const groups: { [key: string]: typeof allPages } = {};
    allPages.forEach(page => {
      const letter = page.title[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(page);
    });
    return groups;
  }, [allPages]);

  const sortedLetters = Object.keys(groupedPages).sort();

  // Get all unique letters
  const allLetters = useMemo(() => {
    const letters = new Set<string>();
    allPages.forEach(page => {
      letters.add(page.title[0].toUpperCase());
    });
    return Array.from(letters).sort();
  }, [allPages]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setNewPageTitle(title);
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setNewPageSlug(slug);
    setSlugError('');
  };

  const handleModeSwitch = (mode: 'visual' | 'code') => {
    if (mode === 'code' && editMode === 'visual') {
      setCodeContent(newPageContent);
    } else if (mode === 'visual' && editMode === 'code') {
      setNewPageContent(codeContent);
    }
    setEditMode(mode);
  };

  const handleCreatePage = async () => {
    if (!user || !newPageTitle || !newPageSlug) return;

    // Validate slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newPageSlug)) {
      setSlugError('Slug must be lowercase letters, numbers, and hyphens only');
      return;
    }

    // Check if slug conflicts with handbook pages
    if (handbookPages.some(p => p.slug === newPageSlug)) {
      setSlugError('This slug is already used by a handbook page');
      return;
    }

    setCreating(true);
    try {
      const contentToSave = editMode === 'code' ? codeContent : newPageContent;
      const response = await fetch('/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newPageSlug,
          title: newPageTitle,
          content: contentToSave || '<p>Start writing your wiki page here...</p>',
          userId: user.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewPageTitle('');
        setNewPageSlug('');
        setNewPageContent('');
        setCodeContent('');
        navigate(`/wiki/user/${data.slug}`);
      } else {
        const error = await response.text();
        if (response.status === 409) {
          setSlugError('A page with this slug already exists');
        } else {
          alert('Error creating page: ' + error);
        }
      }
    } catch (error) {
      console.error('Error creating wiki page:', error);
      alert('Error creating page');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex items-center justify-between">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs text-white/70 hover:text-white"
          >
            + Create Page
          </button>
        )}
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/handbook" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>All Pages</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-4">Welcome to the Horizon Wiki</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Info sections and articles */}
          <div className="flex-1">
            {/* Info sections */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">What is this?</h3>
              <p className="text-sm text-gray-700 mb-4">
                The home base for all information about Horizon.
              </p>

              <h3 className="text-base font-semibold text-gray-900 mb-1">Can I add articles?</h3>
              <p className="text-sm text-gray-700">
                Every Horizon member has access to edit the Wiki— if you have some extra time and muse on your hands, feel free to add whatever you want (characters, family lines, etc.)! Please note that all articles are moderated by staff.
              </p>
            </div>

            {/* Alphabet Navigation */}
            <div className="bg-white border border-stone-300 p-2 mb-6">
              <div className="flex flex-wrap gap-1 justify-center">
                {allLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    className={`w-6 h-6 text-sm flex items-center justify-center font-bold transition-colors ${
                      groupedPages[letter]
                        ? 'text-[#2f3a2f] hover:bg-[#2f3a2f] hover:text-white'
                        : 'text-stone-300 cursor-not-allowed'
                    }`}
                    disabled={!groupedPages[letter]}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Count */}
            <div className="mb-4">
              <h2 className="text-base font-semibold text-stone-800">
                All Wiki Pages:
              </h2>
              <p className="text-xs text-stone-600">
                There are {allPages.length} articles in the wiki{loadingUserPages ? ' (loading...)' : ''}:
              </p>
            </div>

            {/* Articles by Letter */}
            <div className="space-y-6">
              {sortedLetters.map(letter => (
                <div key={letter} id={`letter-${letter}`} className="scroll-mt-4">
                  <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-2">
                    {letter}
                  </h3>
                  <div className="flex flex-col">
                    {groupedPages[letter].map(page => (
                      <Link
                        key={page.slug}
                        to={page.isHandbook ? `/wiki/${page.slug}` : `/wiki/user/${page.slug}`}
                        className="text-sm text-[#2f3a2f] hover:underline py-0.5 block"
                      >
                        {page.title}
                        {!page.isHandbook && (
                          <span className="text-xs text-gray-400 ml-2">(user)</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            {/* Search Box */}
            <div className="bg-white border border-stone-300 mb-4">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Search the Wiki
              </div>
              <div className="p-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-[#2f3a2f]"
                  />
                  <button
                    className="bg-[#2f3a2f] text-white px-4 py-2 text-sm hover:bg-[#3d4a3d] transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-stone-300">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Links
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li>
                    <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Index</Link>
                  </li>
                  <li>
                    <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">Game Overview</Link>
                  </li>
                  <li>
                    <Link to="/wiki/getting-started" className="text-[#2f3a2f] hover:underline">Getting Started</Link>
                  </li>
                  <li>
                    <Link to="/wiki/rules-compilation" className="text-[#2f3a2f] hover:underline">Rules: Compilation</Link>
                  </li>
                  <li>
                    <Link to="/wiki/faq" className="text-[#2f3a2f] hover:underline">FAQ</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="bg-[#2f3a2f] px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold">Create New Wiki Page</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Title */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Page Title *</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter page title..."
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                />
              </div>

              {/* Slug */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL Slug *
                  <span className="font-normal text-gray-500 ml-1">(auto-generated from title)</span>
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-1">/wiki/user/</span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) => {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      setSlugError('');
                    }}
                    placeholder="page-slug"
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                  />
                </div>
                {slugError && <p className="text-xs text-red-600 mt-1">{slugError}</p>}
              </div>

              {/* Content */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Content</label>
                  <div className="flex gap-2">
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
                </div>

                {editMode === 'visual' ? (
                  <div className="wiki-editor-container border border-gray-300">
                    <RichTextEditor
                      value={newPageContent}
                      onChange={setNewPageContent}
                      placeholder="Write your wiki page content..."
                    />
                  </div>
                ) : (
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="w-full h-64 border border-gray-300 p-3 font-mono text-xs text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                    placeholder="<p>Write your HTML content here...</p>"
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePage}
                  disabled={creating || !newPageTitle || !newPageSlug}
                  className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3d4a3d] disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TitleList;
