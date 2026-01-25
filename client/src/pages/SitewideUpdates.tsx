import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User } from '../types';

interface SitewideUpdate {
  UpdateID: number;
  Content: string;
  CreatedAt: string;
  CreatedByUsername?: string;
}

const SitewideUpdates: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const [updates, setUpdates] = useState<SitewideUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const isModerator = user?.isModerator || user?.isAdmin;

  useEffect(() => {
    fetchUpdates();
  }, [currentPage]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sitewide-updates?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching sitewide updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (updateId: number) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sitewide-updates/${updateId}`, {
        method: 'DELETE',
        headers: { 'X-Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setUpdates(updates.filter(u => u.UpdateID !== updateId));
        setTotalCount(prev => prev - 1);
      } else {
        alert('Failed to delete update');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Failed to delete update');
    }
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `(${month}/${day}/${year}, ${hours}:${minutes}${ampm})`;
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Sitewide Updates</h2>
      </div>

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">All Sitewide Updates</h1>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No updates yet.</div>
        ) : (
          <>
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.UpdateID} className="pb-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm text-gray-800">
                      <span className="text-gray-500 font-semibold">{formatDate(update.CreatedAt)}</span>{' '}
                      <span dangerouslySetInnerHTML={{ __html: update.Content }} />
                    </div>
                    {isModerator && (
                      <button
                        onClick={() => handleDelete(update.UpdateID)}
                        className="text-xs text-gray-400 hover:text-red-600 flex-shrink-0"
                        title="Delete update"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} updates
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SitewideUpdates;
