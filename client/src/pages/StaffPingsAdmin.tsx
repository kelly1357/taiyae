import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { User } from '../types';

interface StaffPing {
  PingID: number;
  UserID: number | null;
  Username: string | null;
  IsAnonymous: boolean;
  Message: string;
  PageUrl: string | null;
  CreatedAt: string;
  IsResolved: boolean;
  ResolvedAt: string | null;
  ResolvedByUserID: number | null;
  ResolvedByUsername: string | null;
  ResolutionNote: string | null;
}

interface LayoutContext {
  user?: User;
}

const StaffPingsAdmin: React.FC = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [pings, setPings] = useState<StaffPing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isModerator = user?.isModerator || user?.isAdmin;

  const fetchPings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/staff-pings/list?showResolved=${showResolved}`, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPings(data);
      }
    } catch (error) {
      console.error('Error fetching pings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPings();
  }, [showResolved]);

  const handleResolve = async (pingId: number) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/staff-pings/${pingId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolvedByUserId: user.id,
          resolutionNote: resolutionNote.trim() || null
        })
      });

      if (response.ok) {
        setResolvingId(null);
        setResolutionNote('');
        fetchPings();
      }
    } catch (error) {
      console.error('Error resolving ping:', error);
    }
  };

  const handleUnresolve = async (pingId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/staff-pings/${pingId}/unresolve`, {
        method: 'POST',
        headers: { 'X-Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPings();
      }
    } catch (error) {
      console.error('Error unresolving ping:', error);
    }
  };

  const handleDelete = async (pingId: number) => {
    if (!confirm('Are you sure you want to permanently delete this ping?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/staff-pings/${pingId}`, {
        method: 'DELETE',
        headers: { 'X-Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPings();
      }
    } catch (error) {
      console.error('Error deleting ping:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isModerator) {
    return (
      <div className="bg-white border border-gray-300 shadow p-8 text-center">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  const unresolvedPings = pings.filter(p => !p.IsResolved);
  const resolvedPings = pings.filter(p => p.IsResolved);

  return (
    <div className="space-y-4">
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Staff Pings</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="w-3.5 h-3.5"
              />
              Show Resolved
            </label>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : unresolvedPings.length === 0 && !showResolved ? (
            <p className="text-gray-500 text-center py-8">No pending staff pings!</p>
          ) : (
            <div className="space-y-4">
              {/* Unresolved Pings */}
              {unresolvedPings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Pending ({unresolvedPings.length})
                  </h3>
                  <div className="space-y-3">
                    {unresolvedPings.map(ping => (
                      <div key={ping.PingID} className="border border-amber-200 bg-amber-50">
                        <div className="px-4 py-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-gray-500">
                              <span className="font-medium text-gray-700">
                                {ping.IsAnonymous ? (
                                  <span className="italic text-gray-400">Anonymous</span>
                                ) : (
                                  ping.Username || 'Unknown User'
                                )}
                              </span>
                              <span className="mx-2">•</span>
                              {formatDate(ping.CreatedAt)}
                            </div>
                            <div className="flex gap-1">
                              {resolvingId !== ping.PingID && (
                                <button
                                  onClick={() => setResolvingId(ping.PingID)}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                  Resolve
                                </button>
                              )}
                              {user?.isAdmin && (
                                <button
                                  onClick={() => handleDelete(ping.PingID)}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{ping.Message}</p>
                          
                          {ping.PageUrl && (
                            <div className="mt-2 text-xs">
                              <span className="text-gray-500">Page: </span>
                              <a 
                                href={ping.PageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {ping.PageUrl}
                              </a>
                            </div>
                          )}

                          {resolvingId === ping.PingID && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Resolution Note (optional)
                              </label>
                              <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                                rows={2}
                                placeholder="How was this resolved?"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleResolve(ping.PingID)}
                                  className="text-xs px-3 py-1.5 bg-green-600 text-white hover:bg-green-700"
                                >
                                  Mark as Resolved
                                </button>
                                <button
                                  onClick={() => { setResolvingId(null); setResolutionNote(''); }}
                                  className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Pings */}
              {showResolved && resolvedPings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Resolved ({resolvedPings.length})
                  </h3>
                  <div className="space-y-3">
                    {resolvedPings.map(ping => (
                      <div key={ping.PingID} className="border border-gray-200 bg-gray-50">
                        <div className="px-4 py-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-gray-500">
                              <span className="font-medium text-gray-700">
                                {ping.IsAnonymous ? (
                                  <span className="italic text-gray-400">Anonymous</span>
                                ) : (
                                  ping.Username || 'Unknown User'
                                )}
                              </span>
                              <span className="mx-2">•</span>
                              {formatDate(ping.CreatedAt)}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setExpandedId(expandedId === ping.PingID ? null : ping.PingID)}
                                className="text-xs px-2 py-1 bg-gray-200 text-gray-600 hover:bg-gray-300"
                              >
                                {expandedId === ping.PingID ? 'Hide Details' : 'Show Details'}
                              </button>
                              <button
                                onClick={() => handleUnresolve(ping.PingID)}
                                className="text-xs px-2 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200"
                              >
                                Reopen
                              </button>
                              {user?.isAdmin && (
                                <button
                                  onClick={() => handleDelete(ping.PingID)}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{ping.Message}</p>
                          
                          {expandedId === ping.PingID && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs space-y-1">
                              {ping.PageUrl && (
                                <div>
                                  <span className="text-gray-500">Page: </span>
                                  <a 
                                    href={ping.PageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {ping.PageUrl}
                                  </a>
                                </div>
                              )}
                              <div className="bg-green-50 border border-green-200 p-2 mt-2">
                                <div className="text-green-700 font-medium">
                                  Resolved by {ping.ResolvedByUsername || 'Unknown'} on {ping.ResolvedAt ? formatDate(ping.ResolvedAt) : 'Unknown'}
                                </div>
                                {ping.ResolutionNote && (
                                  <p className="text-green-600 mt-1">{ping.ResolutionNote}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StaffPingsAdmin;
