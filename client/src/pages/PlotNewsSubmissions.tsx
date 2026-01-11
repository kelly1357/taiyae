import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User } from '../types';

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

const PlotNewsSubmissions: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const [submissions, setSubmissions] = useState<PlotNewsSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    packName: string;
    newsText: string;
    threadURL: string;
    threadTitle: string;
  }>({ packName: '', newsText: '', threadURL: '', threadTitle: '' });

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/plot-news/pending');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApprove = async (plotNewsId: number) => {
    setApproving(plotNewsId);
    try {
      const response = await fetch('/api/plot-news/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plotNewsId, userId: user?.id })
      });
      
      if (response.ok) {
        setSubmissions(prev => prev.filter(s => s.PlotNewsID !== plotNewsId));
      } else {
        alert('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve');
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (plotNewsId: number) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    setDeleting(plotNewsId);
    try {
      const response = await fetch(`/api/plot-news/${plotNewsId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSubmissions(prev => prev.filter(s => s.PlotNewsID !== plotNewsId));
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (submission: PlotNewsSubmission) => {
    setEditingId(submission.PlotNewsID);
    setEditForm({
      packName: submission.PackName || '',
      newsText: submission.NewsText || '',
      threadURL: submission.ThreadURL || '',
      threadTitle: submission.ThreadTitle || ''
    });
  };

  const handleSaveEdit = async (plotNewsId: number) => {
    try {
      const response = await fetch(`/api/plot-news/${plotNewsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packName: editForm.packName,
          newsText: editForm.newsText,
          threadURL: editForm.threadURL || null,
          threadTitle: editForm.threadTitle || null
        })
      });
      
      if (response.ok) {
        setSubmissions(prev => prev.map(s => 
          s.PlotNewsID === plotNewsId 
            ? { ...s, PackName: editForm.packName, NewsText: editForm.newsText, ThreadURL: editForm.threadURL, ThreadTitle: editForm.threadTitle }
            : s
        ));
        setEditingId(null);
      } else {
        alert('Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update');
    }
  };

  // Check if user is moderator/admin
  if (!user || (!user.isModerator && !user.isAdmin)) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Access Denied</h2>
        </div>
        <div className="p-6 text-center text-gray-600">
          You do not have permission to view this page.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Plot News Submissions</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No pending plot news submissions to review.</div>
        ) : (
          <div className="space-y-4">
            {submissions.map(submission => (
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
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                        rows={2}
                      />
                      <div className="text-xs text-gray-500 text-right">{editForm.newsText.length}/150</div>
                    </div>

                    {/* Thread */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Thread</label>
                      <input
                        type="text"
                        value={editForm.threadTitle}
                        onChange={(e) => setEditForm(prev => ({ ...prev, threadTitle: e.target.value }))}
                        placeholder="Thread title"
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
                      />
                      <input
                        type="url"
                        value={editForm.threadURL}
                        onChange={(e) => setEditForm(prev => ({ ...prev, threadURL: e.target.value }))}
                        placeholder="Thread URL"
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(submission.PlotNewsID)}
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
                          onClick={() => handleApprove(submission.PlotNewsID)}
                          disabled={approving === submission.PlotNewsID}
                          className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {approving === submission.PlotNewsID ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleEdit(submission)}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(submission.PlotNewsID)}
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
        
        <div className="mt-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PlotNewsSubmissions;
