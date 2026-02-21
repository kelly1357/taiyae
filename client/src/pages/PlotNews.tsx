import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User } from '../types';

interface PlotNewsItem {
  PlotNewsID: number;
  PackName: string;
  NewsText: string;
  ThreadURL?: string;
  ThreadTitle?: string;
  ApprovedAt?: string;
  SubmittedAt?: string;
  SubmittedByUsername?: string;
}

const PlotNews: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const [plotNews, setPlotNews] = useState<PlotNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Form state
  const [plotNewsForm, setPlotNewsForm] = useState({
    packNames: [] as string[],
    newsText: '',
    threadURL: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PlotNewsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [packs, setPacks] = useState<{ id: number; name: string; slug: string; color1: string; color2: string; isActive: boolean }[]>([]);

  useEffect(() => {
    fetchPlotNews();
  }, [currentPage]);

  useEffect(() => {
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        // Include all packs for tag coloring (active and inactive)
        setPacks(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const fetchPlotNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/plot-news/all?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setPlotNews(data.items);
        setTotalCount(data.totalCount);
      }
    } catch (error) {
      console.error('Error fetching plot news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!plotNewsForm.newsText.trim()) {
      setMessage({ type: 'error', text: 'Please enter plot news text.' });
      return;
    }
    if (!plotNewsForm.threadURL.trim()) {
      setMessage({ type: 'error', text: 'Please enter a thread URL.' });
      return;
    }
    if (plotNewsForm.packNames.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one pack.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      // Submit one entry per pack
      for (const packName of plotNewsForm.packNames) {
        const response = await fetch('/api/plot-news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            packName,
            newsText: plotNewsForm.newsText.trim(),
            threadURL: plotNewsForm.threadURL.trim(),
            userId: user?.id
          })
        });

        if (!response.ok) {
          const error = await response.text();
          setMessage({ type: 'error', text: error || 'Failed to submit plot news.' });
          setIsSubmitting(false);
          return;
        }
      }

      setMessage({ type: 'success', text: 'Plot news submitted for review!' });
      setPlotNewsForm({ packNames: [], newsText: '', threadURL: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit plot news.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (news: PlotNewsItem) => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/plot-news/${news.PlotNewsID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        // Remove from local state
        setPlotNews(prev => prev.filter(item => item.PlotNewsID !== news.PlotNewsID));
        setTotalCount(prev => prev - 1);
        setDeleteConfirm(null);
      } else {
        const error = await response.text();
        alert(error || 'Failed to delete plot news');
      }
    } catch (error) {
      console.error('Error deleting plot news:', error);
      alert('Failed to delete plot news');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Plot News</h2>
      </div>

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">All Plot News</h1>
        <div className="flex gap-6">
          {/* Plot News List - 2/3 width */}
          <div className="w-2/3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : plotNews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No plot news yet.</div>
            ) : (
              <div className="space-y-3">
                {/* Group plot news by content */}
                {(() => {
                  const grouped = plotNews.reduce((acc, news) => {
                    const key = `${news.NewsText}||${news.ThreadURL || ''}`;
                    if (!acc[key]) {
                      acc[key] = { ...news, packNames: [news.PackName], allIds: [news.PlotNewsID] };
                    } else {
                      acc[key].packNames.push(news.PackName);
                      acc[key].allIds.push(news.PlotNewsID);
                    }
                    return acc;
                  }, {} as Record<string, PlotNewsItem & { packNames: string[], allIds: number[] }>);
                  
                  return Object.values(grouped).map((news) => (
                    <div key={news.PlotNewsID} className="text-sm text-gray-800 pb-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {news.SubmittedAt && (
                            <div className="text-xs text-gray-400 uppercase mb-1 font-bold">
                              SUBMITTED BY {news.SubmittedByUsername || 'Unknown'} ON ({new Date(news.SubmittedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })})
                            </div>
                          )}
                          {news.packNames.map((packName) => {
                            const pack = packs.find(p => p.name === packName);
                            const isRogue = packName === 'Rogue';
                            const initials = isRogue ? 'R' : packName.split(' ').length > 1 ? packName.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : packName.slice(0, 2).toUpperCase();
                            return (
                              <span 
                                key={packName}
                                className="inline-block w-7 text-center py-px text-xs font-normal mr-1"
                                style={pack ? { 
                                  backgroundColor: `${pack.color1}30`, 
                                  color: pack.color1 
                                } : { 
                                  backgroundColor: '#e5e7eb', 
                                  color: '#4b5563' 
                                }}
                              >
                                {initials}
                              </span>
                            );
                          })}
                          <span className="ml-1">{news.NewsText}</span>
                          {news.ThreadURL && (
                            <span className="text-gray-600">
                              {' '}
                              (<a href={news.ThreadURL} className="text-gray-600 hover:text-gray-900 hover:underline font-bold">"{news.ThreadTitle || 'thread'}"</a>)
                            </span>
                          )}
                        </div>
                        {(user?.isModerator || user?.isAdmin) && (
                          <button
                            onClick={() => setDeleteConfirm(news)}
                            className="text-xs text-gray-400 hover:text-red-600 flex-shrink-0"
                            title="Delete plot news"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Submit Form - 1/3 width */}
          <div className="w-1/3">
            <div className="bg-gray-100 border border-gray-300 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Submit Plot News</h3>
              
              {user ? (
                <div className="space-y-4">
                  {/* Pack Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Pack(s)</label>
                    <div className="flex flex-col gap-2">
                      {/* Rogues */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plotNewsForm.packNames.includes('Rogue')}
                          onChange={(e) => setPlotNewsForm(prev => ({ 
                            ...prev, 
                            packNames: e.target.checked 
                              ? [...prev.packNames, 'Rogue'] 
                              : prev.packNames.filter(n => n !== 'Rogue')
                          }))}
                          className="w-4 h-4"
                        />
                        <span className="inline-block w-7 text-center py-px text-xs font-normal bg-gray-200 text-gray-600">R</span>
                        <span className="uppercase tracking-wide text-gray-600 text-sm" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogues</span>
                      </label>
                      {/* Active Packs */}
                      {packs.filter(p => p.isActive).map(pack => (
                        <label key={pack.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={plotNewsForm.packNames.includes(pack.name)}
                            onChange={(e) => setPlotNewsForm(prev => ({ 
                              ...prev, 
                              packNames: e.target.checked 
                                ? [...prev.packNames, pack.name] 
                                : prev.packNames.filter(n => n !== pack.name)
                            }))}
                            className="w-4 h-4"
                          />
                          <span 
                            className="inline-block w-7 text-center py-px text-xs font-normal text-white"
                            style={{ backgroundColor: `${pack.color1}99` }}
                          >
                            {pack.name.split(' ').length > 1 ? pack.name.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : pack.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span 
                            className="uppercase tracking-wide text-sm" 
                            style={{ 
                              fontFamily: 'Baskerville, "Times New Roman", serif',
                              background: `linear-gradient(135deg, ${pack.color1}, ${pack.color2})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}
                          >
                            {pack.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Plot News Text */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Plot News</label>
                    <textarea
                      value={plotNewsForm.newsText}
                      onChange={(e) => {
                        if (e.target.value.length <= 150) {
                          setPlotNewsForm(prev => ({ ...prev, newsText: e.target.value }));
                        }
                      }}
                      placeholder="Enter your plot news update..."
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400 placeholder:italic"
                      rows={3}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {plotNewsForm.newsText.length}/150 characters
                    </div>
                  </div>

                  {/* Thread URL */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Thread</label>
                    <input
                      type="url"
                      value={plotNewsForm.threadURL}
                      onChange={(e) => setPlotNewsForm(prev => ({ ...prev, threadURL: e.target.value }))}
                      placeholder="Thread URL"
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400 placeholder:italic"
                    />
                  </div>

                  {/* Message */}
                  {message && (
                    <div className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {message.text}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || plotNewsForm.packNames.length === 0 || !plotNewsForm.newsText.trim()}
                    className="w-full px-4 py-2 text-sm bg-[#2f3a2f] text-white hover:bg-[#3a4a3a] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 italic">Please log in to submit plot news.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Delete Plot News?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this plot news item?
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <span className="inline-block w-7 text-center py-px text-xs font-normal bg-gray-200 text-gray-600 mr-2">
                {deleteConfirm.PackName === 'Rogue' ? 'R' : deleteConfirm.PackName.split(' ').length > 1 ? deleteConfirm.PackName.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : deleteConfirm.PackName.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-sm text-gray-700">{deleteConfirm.NewsText}</span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlotNews;
