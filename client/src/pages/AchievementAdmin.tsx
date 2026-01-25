import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

interface PendingRequest {
  RequestID: number;
  UserID: number;
  Username: string;
  AchievementID: number;
  AchievementName: string;
  AchievementImage: string;
  RequestNote: string | null;
  RequestedAt: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  isAutomated: boolean;
}

interface User {
  UserID: number;
  Username: string;
}

export default function AchievementAdmin() {
  const { user } = useUser();
  // Get user ID - API returns UserID but type expects id
  const moderatorId = (user as any)?.UserID || user?.id;
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Manual award state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardUserId, setAwardUserId] = useState('');
  const [awardAchievementId, setAwardAchievementId] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAwarding, setIsAwarding] = useState(false);

  // Reject modal state
  const [rejectRequest, setRejectRequest] = useState<PendingRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [requestsRes, achievementsRes] = await Promise.all([
        fetch('/api/achievements/requests/pending', {
          headers: { 'X-Authorization': `Bearer ${token}` }
        }),
        fetch('/api/achievements')
      ]);

      setPendingRequests(await requestsRes.json());
      setAchievements(await achievementsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: number) {
    if (!moderatorId) return;

    setProcessingId(requestId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/achievements/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ moderatorUserId: moderatorId })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Achievement approved and awarded!' });
        setPendingRequests(pendingRequests.filter(r => r.RequestID !== requestId));
      } else {
        setMessage({ type: 'error', text: await res.text() });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving request' });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject() {
    if (!rejectRequest || !moderatorId) return;

    setProcessingId(rejectRequest.RequestID);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/achievements/requests/${rejectRequest.RequestID}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moderatorUserId: moderatorId,
          reviewNote: rejectNote
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Request rejected' });
        setPendingRequests(pendingRequests.filter(r => r.RequestID !== rejectRequest.RequestID));
        setRejectRequest(null);
        setRejectNote('');
      } else {
        setMessage({ type: 'error', text: await res.text() });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error rejecting request' });
    } finally {
      setProcessingId(null);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setAllUsers(await res.json());
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function handleManualAward() {
    if (!awardUserId || !awardAchievementId || !moderatorId) return;

    setIsAwarding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/achievements/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: parseInt(awardUserId),
          achievementId: parseInt(awardAchievementId),
          moderatorUserId: moderatorId
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Achievement awarded successfully!' });
        setShowAwardModal(false);
        setAwardUserId('');
        setAwardAchievementId('');
      } else {
        setMessage({ type: 'error', text: await res.text() });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error awarding achievement' });
    } finally {
      setIsAwarding(false);
    }
  }

  // Check if user is moderator/admin
  if (!user?.isModerator && !user?.isAdmin) {
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

  if (loading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Achievement Administration</h2>
        </div>
        <div className="p-6 text-center text-gray-500">Loading...</div>
      </section>
    );
  }

  const manualAchievements = achievements.filter(a => !a.isAutomated);

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 flex justify-between items-center">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Achievement Administration</h2>
        <button
          onClick={() => {
            loadUsers();
            setShowAwardModal(true);
          }}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
        >
          + Award Achievement
        </button>
      </div>

      <div className="p-4">
        {message && (
          <div className={`mb-4 p-3 border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right text-xl leading-none">&times;</button>
          </div>
        )}

        {/* Pending Requests */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">
            Pending Requests ({pendingRequests.length})
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 italic">No pending achievement requests.</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div key={req.RequestID} className="border border-gray-300 p-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={req.AchievementImage || '/achievements/default.png'} 
                      alt={req.AchievementName}
                      className="w-14 h-14 rounded-full border border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{req.AchievementName}</h4>
                          <p className="text-sm text-gray-600">
                            Requested by{' '}
                            <Link to={`/character/${req.UserID}`} className="text-gray-800 font-semibold hover:underline">
                              {req.Username}
                            </Link>
                            {' '}on {new Date(req.RequestedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.RequestID)}
                            disabled={processingId === req.RequestID}
                            className="px-3 py-1 bg-green-600 text-white text-sm hover:bg-green-500 disabled:opacity-50"
                          >
                            {processingId === req.RequestID ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectRequest(req)}
                            disabled={processingId === req.RequestID}
                            className="px-3 py-1 bg-red-600 text-white text-sm hover:bg-red-500 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      {req.RequestNote && (
                        <div className="mt-2 p-2 bg-gray-100 border border-gray-200 text-sm text-gray-700">
                          <strong>Note:</strong> {req.RequestNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Award Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAwardModal(false)}>
          <div className="bg-white border border-gray-300 shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2f3a2f] px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Award Achievement</h3>
            </div>
            <div className="p-4">
              <label className="block mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">User</span>
                <select
                  value={awardUserId}
                  onChange={e => setAwardUserId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">Select a user...</option>
                  {allUsers.map(u => (
                    <option key={u.UserID} value={u.UserID}>{u.Username}</option>
                  ))}
                </select>
              </label>

              <label className="block mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">Achievement</span>
                <select
                  value={awardAchievementId}
                  onChange={e => setAwardAchievementId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">Select an achievement...</option>
                  {manualAchievements.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAwardModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAward}
                  disabled={!awardUserId || !awardAchievementId || isAwarding}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 text-sm"
                >
                  {isAwarding ? 'Awarding...' : 'Award'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRejectRequest(null)}>
          <div className="bg-white border border-gray-300 shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2f3a2f] px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Reject Request</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 mb-4">
                Rejecting <strong>{rejectRequest.AchievementName}</strong> request from{' '}
                <strong>{rejectRequest.Username}</strong>
              </p>

              <label className="block mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">Reason (optional)</span>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  rows={3}
                  placeholder="Why is this request being rejected?"
                />
              </label>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRejectRequest(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId === rejectRequest.RequestID}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 text-sm"
                >
                  {processingId === rejectRequest.RequestID ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
