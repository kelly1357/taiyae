import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

interface PlotNewsSubmission {
  PlotNewsID: number;
  PackName: string;
  NewsText: string;
  ThreadURL?: string;
  ThreadTitle?: string;
  SubmittedByUserID?: number;
  SubmittedByUsername?: string;
  SubmittedAt: string;
}

export default function HomepageAdmin() {
  const { user } = useUser();
  
  // Plot News Submissions state
  const [plotNewsSubmissions, setPlotNewsSubmissions] = useState<PlotNewsSubmission[]>([]);
  const [plotNewsLoading, setPlotNewsLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PlotNewsSubmission | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    packName: string;
    newsText: string;
    threadURL: string;
    threadTitle: string;
  }>({ packName: '', newsText: '', threadURL: '', threadTitle: '' });
  
  // Bulletin state
  const [bulletinContent, setBulletinContent] = useState('');
  const [bulletinEnabled, setBulletinEnabled] = useState(false);
  const [bulletinLoading, setBulletinLoading] = useState(true);
  const [bulletinSaving, setBulletinSaving] = useState(false);
  
  // Sitewide Updates state
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get user ID
  const userId = (user as any)?.UserID || user?.id;
  const isModerator = user?.isModerator || user?.isAdmin;

  useEffect(() => {
    loadPlotNewsSubmissions();
    loadBulletin();
    loadUpdates();
  }, []);

  async function loadPlotNewsSubmissions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/plot-news/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlotNewsSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching plot news submissions:', error);
    } finally {
      setPlotNewsLoading(false);
    }
  }

  async function loadBulletin() {
    try {
      const res = await fetch('/api/bulletin');
      if (res.ok) {
        const data = await res.json();
        setBulletinContent(data.Content || '');
        setBulletinEnabled(data.IsEnabled || false);
      }
    } catch (error) {
      console.error('Error loading bulletin:', error);
    } finally {
      setBulletinLoading(false);
    }
  }

  async function loadUpdates() {
    try {
      const res = await fetch('/api/sitewide-updates?limit=20');
      if (res.ok) {
         await res.json();
      }
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setUpdatesLoading(false);
    }
  }

  async function handleSaveBulletin() {
    setBulletinSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bulletin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: bulletinContent,
          isEnabled: bulletinEnabled,
          userId
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Bulletin saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save bulletin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving bulletin' });
    } finally {
      setBulletinSaving(false);
    }
  }

  async function handleAddUpdate() {
    if (!newUpdateContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter update content' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sitewide-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newUpdateContent,
          userId
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Update added successfully!' });
        setNewUpdateContent('');
        loadUpdates();
      } else {
        setMessage({ type: 'error', text: 'Failed to add update' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding update' });
    } finally {
      setSubmitting(false);
    }
  }

  // Plot News handlers
  const handleApprovePlotNews = async (plotNewsId: number) => {
    setApproving(plotNewsId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/plot-news/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plotNewsId, userId })
      });
      
      if (response.ok) {
        setPlotNewsSubmissions(prev => prev.filter(s => s.PlotNewsID !== plotNewsId));
        setMessage({ type: 'success', text: 'Plot news approved!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to approve' });
      }
    } catch (error) {
      console.error('Error approving:', error);
      setMessage({ type: 'error', text: 'Failed to approve' });
    } finally {
      setApproving(null);
    }
  };

  const handleDeletePlotNews = async (submission: PlotNewsSubmission) => {
    setDeleting(submission.PlotNewsID);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/plot-news/${submission.PlotNewsID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setPlotNewsSubmissions(prev => prev.filter(s => s.PlotNewsID !== submission.PlotNewsID));
        setDeleteConfirm(null);
        setMessage({ type: 'success', text: 'Plot news deleted!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete' });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage({ type: 'error', text: 'Failed to delete' });
    } finally {
      setDeleting(null);
    }
  };

  const handleEditPlotNews = (submission: PlotNewsSubmission) => {
    setEditingId(submission.PlotNewsID);
    setEditForm({
      packName: submission.PackName || '',
      newsText: submission.NewsText || '',
      threadURL: submission.ThreadURL || '',
      threadTitle: submission.ThreadTitle || ''
    });
  };

  const handleSaveEditPlotNews = async (plotNewsId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/plot-news/${plotNewsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packName: editForm.packName,
          newsText: editForm.newsText,
          threadURL: editForm.threadURL || null,
          threadTitle: editForm.threadTitle || null
        })
      });
      
      if (response.ok) {
        setPlotNewsSubmissions(prev => prev.map(s => 
          s.PlotNewsID === plotNewsId 
            ? { ...s, PackName: editForm.packName, NewsText: editForm.newsText, ThreadURL: editForm.threadURL, ThreadTitle: editForm.threadTitle }
            : s
        ));
        setEditingId(null);
        setMessage({ type: 'success', text: 'Plot news updated!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update' });
      }
    } catch (error) {
      console.error('Error updating:', error);
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };


  // Check if user is moderator or admin
  if (!isModerator) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Homepage Management</h2>
        </div>
        <div className="p-6 text-center text-gray-600">
          You do not have permission to view this page.
        </div>
      </section>
    );
  }

  const loading = bulletinLoading || updatesLoading || plotNewsLoading;

  if (loading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Homepage Management</h2>
        </div>
        <div className="p-6 text-center text-gray-500">Loading...</div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Homepage Management</h2>
      </div>

      <div className="p-6">
        {message && (
          <div className={`mb-4 p-3 border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right text-xl leading-none">&times;</button>
          </div>
        )}

        {/* PLOT NEWS SUBMISSIONS SECTION */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          Plot News Submissions {plotNewsSubmissions.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{plotNewsSubmissions.length}</span>}
        </h2>

        {plotNewsSubmissions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 mb-6">No pending plot news submissions to review.</div>
        ) : (
          <div className="space-y-4 mb-6">
            {plotNewsSubmissions.map(submission => (
              <div key={submission.PlotNewsID} className="border border-gray-300 p-4">
                {editingId === submission.PlotNewsID ? (
                  // Edit mode
                  <div className="space-y-3">
                    {/* Pack Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Pack</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.packName === 'Rogue'}
                            onChange={(e) => setEditForm(prev => ({ ...prev, packName: e.target.checked ? 'Rogue' : '' }))}
                            className="w-4 h-4"
                          />
                          <span className="inline-block px-4 py-px text-xs font-normal bg-gray-200 text-gray-600">R</span>
                          <span className="uppercase tracking-wide text-gray-600 text-sm" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogues</span>
                        </label>
                      </div>
                    </div>

                    {/* News Text */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Plot News</label>
                      <textarea
                        value={editForm.newsText}
                        onChange={(e) => {
                          if (e.target.value.length <= 150) {
                            setEditForm(prev => ({ ...prev, newsText: e.target.value }));
                          }
                        }}
                        className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        rows={2}
                      />
                      <div className="text-xs text-gray-500 text-right">{editForm.newsText.length}/150</div>
                    </div>

                    {/* Thread */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Thread URL</label>
                      <input
                        type="url"
                        value={editForm.threadURL}
                        onChange={(e) => setEditForm(prev => ({ ...prev, threadURL: e.target.value }))}
                        placeholder="Thread URL"
                        className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEditPlotNews(submission.PlotNewsID)}
                        className="px-3 py-1 text-xs bg-[#2f3a2f] text-white hover:bg-[#3a4a3a]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-3 py-px text-xs font-normal bg-gray-200 text-gray-600">
                            {submission.PackName === 'Rogue' ? 'R' : submission.PackName?.charAt(0).toUpperCase() || '?'}
                          </span>
                          <span className="uppercase tracking-wide text-gray-600 text-sm" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
                            {submission.PackName || 'Unknown Pack'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{submission.NewsText}</p>
                        {submission.ThreadTitle && (
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Thread:</span>{' '}
                            {submission.ThreadURL ? (
                              <a href={submission.ThreadURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                "{submission.ThreadTitle}"
                              </a>
                            ) : (
                              <>"{submission.ThreadTitle}"</>
                            )}
                          </div>
                        )}
                        {submission.ThreadURL && !submission.ThreadTitle && (
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">URL:</span>{' '}
                            <a href={submission.ThreadURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {submission.ThreadURL}
                            </a>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Submitted by {submission.SubmittedByUsername || 'Unknown'} on {new Date(submission.SubmittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprovePlotNews(submission.PlotNewsID)}
                          disabled={approving === submission.PlotNewsID}
                          className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {approving === submission.PlotNewsID ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleEditPlotNews(submission)}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(submission)}
                          disabled={deleting === submission.PlotNewsID}
                          className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting === submission.PlotNewsID ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SITEWIDE UPDATES SECTION */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          Sitewide Updates
        </h2>

        {/* Add New Update */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Add New Update (HTML supported)
          </label>
          <textarea
            value={newUpdateContent}
            onChange={(e) => setNewUpdateContent(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
            rows={4}
            placeholder="Enter update content here. HTML tags are supported."
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Only the 3 most recent updates will appear on the home page. <Link to="/sitewide-updates" className="text-gray-700 hover:underline font-bold">View All Updates</Link>
            </span>
            <button
              onClick={handleAddUpdate}
              disabled={submitting || !newUpdateContent.trim()}
              className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Update'}
            </button>
          </div>
        </div>

        {/* BULLETIN SECTION */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          Bulletin
        </h2>

        {/* Enable/Disable Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={bulletinEnabled}
              onChange={(e) => setBulletinEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm font-semibold text-gray-700">
              {bulletinEnabled ? 'Bulletin is ENABLED (visible on home page)' : 'Bulletin is DISABLED (hidden from home page)'}
            </span>
          </label>
        </div>

        {/* Content Editor */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Bulletin Content (HTML supported)
          </label>
          <textarea
            value={bulletinContent}
            onChange={(e) => setBulletinContent(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono"
            rows={4}
            placeholder="Enter bulletin content here. HTML tags are supported."
          />
        </div>

        {/* Preview */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Bulletin Preview
          </label>
          <div className="border border-gray-300 bg-[#e5ebd4] px-4 py-3">
            <div className="text-gray-800 text-[13px] text-left">
              <span className="text-[#81973b]">• Bulletin—</span>{' '}
              {bulletinContent ? (
                <span 
                  className="bulletin-content"
                  dangerouslySetInnerHTML={{ __html: bulletinContent }}
                />
              ) : (
                <span className="text-gray-400 italic">No content to preview</span>
              )}
            </div>
          </div>
        </div>

        {/* Save Bulletin */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveBulletin}
            disabled={bulletinSaving}
            className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
          >
            {bulletinSaving ? 'Saving...' : 'Save Bulletin'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Delete Submission?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this plot news submission?
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <span className="inline-block px-4 py-px text-xs font-normal bg-gray-200 text-gray-600 mr-2">
                {deleteConfirm.PackName === 'Rogue' ? 'R' : deleteConfirm.PackName?.charAt(0).toUpperCase() || '?'}
              </span>
              <span className="text-sm text-gray-700">{deleteConfirm.NewsText}</span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={deleting !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlotNews(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={deleting !== null}
              >
                {deleting !== null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
