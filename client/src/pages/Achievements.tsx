import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface Achievement {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  isAutomated: boolean;
  automationKey: string | null;
}

interface UserAchievement {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  AwardedAt: string;
}

export default function Achievements() {
  const { user, loading: userLoading } = useUser();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get user ID - API returns UserID but type expects id
  const userId = (user as any)?.UserID || user?.id;

  useEffect(() => {
    // Wait for user context to finish loading before fetching data
    if (!userLoading) {
      loadData();
    }
  }, [userId, userLoading]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch all achievements
      const achRes = await fetch('/api/achievements');
      const achData = await achRes.json();
      console.log('All achievements:', achData);
      setAchievements(achData);

      console.log('User ID:', userId);
      if (userId) {
        // Fetch user's earned achievements
        const userAchRes = await fetch(`/api/achievements/user/${userId}`);
        const userAchData = await userAchRes.json();
        console.log('User achievements response:', userAchData);
        setUserAchievements(userAchData);

        // Check automated achievements
        await fetch('/api/achievements/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });

        // Reload user achievements in case any were awarded
        const refreshRes = await fetch(`/api/achievements/user/${userId}`);
        const refreshData = await refreshRes.json();
        console.log('Refreshed user achievements:', refreshData);
        setUserAchievements(refreshData);

        // Fetch pending requests for this user
        // We'll need to track this client-side for now
      } else {
        console.log('No user ID available, skipping user achievements fetch');
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  const earnedIds = new Set(userAchievements.map(ua => ua.id));
  console.log('Earned IDs set:', [...earnedIds]);
  console.log('userAchievements state:', userAchievements);

  async function handleRequestSubmit() {
    if (!selectedAchievement || !userId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/achievements/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          achievementId: selectedAchievement.id,
          note: requestNote
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Request submitted! A moderator will review it soon.' });
        setPendingRequests([...pendingRequests, selectedAchievement.id]);
        setSelectedAchievement(null);
        setRequestNote('');
      } else {
        const errorText = await res.text();
        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error submitting request' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Achievements</h2>
        </div>
        <div className="p-6 text-center text-gray-500">Loading achievements...</div>
      </section>
    );
  }

  // Group achievements
  const earnedAchievements = achievements.filter(a => earnedIds.has(a.id));
  const manualAchievements = achievements.filter(a => !a.isAutomated && !earnedIds.has(a.id));
  const automatedAchievements = achievements.filter(a => a.isAutomated && !earnedIds.has(a.id));

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Achievements</h2>
      </div>

      <div className="p-4">
        {message && (
          <div className={`mb-4 p-3 border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right text-xl leading-none">&times;</button>
          </div>
        )}

        {/* Earned Achievements */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">Your Achievements ({earnedAchievements.length})</h3>
          {earnedAchievements.length === 0 ? (
            <p className="text-gray-500 italic text-sm">You haven't earned any achievements yet. Keep participating!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {earnedAchievements.map(ach => {
                const earned = userAchievements.find(ua => ua.id === ach.id);
                return (
                  <div key={ach.id} className="border border-gray-200 p-3 text-center hover:bg-gray-50 transition-colors h-full flex flex-col items-center">
                    <img 
                      src={ach.imageUrl || '/achievements/default.png'} 
                      alt={ach.name}
                      className="w-14 h-14 rounded-full border border-gray-300 flex-shrink-0"
                    />
                    <h4 className="font-semibold text-gray-800 text-xs mt-2">{ach.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 flex-grow">{ach.description}</p>
                    {earned && (
                      <p className="text-xs text-green-600 mt-2">
                        Earned {new Date(earned.AwardedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Manual Achievements */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">Request an Achievement</h3>
          <p className="text-gray-600 text-sm mb-4">
            These achievements require moderator approval. Click one to submit a request!
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {manualAchievements.map(ach => {
              const isPending = pendingRequests.includes(ach.id);
              return (
                <button
                  key={ach.id}
                  onClick={() => !isPending && setSelectedAchievement(ach)}
                  disabled={isPending}
                  className={`border border-gray-200 p-3 text-center transition-colors h-full flex flex-col items-center ${
                    isPending 
                      ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <img 
                    src={ach.imageUrl || '/achievements/default.png'} 
                    alt={ach.name}
                    className="w-14 h-14 rounded-full border border-gray-300 flex-shrink-0"
                  />
                  <h4 className="font-semibold text-gray-600 text-xs mt-2">{ach.name}</h4>
                  <p className="text-xs text-gray-400 mt-1 flex-grow">{ach.description}</p>
                  {isPending && (
                    <span className="text-xs text-yellow-600 mt-2 block">Request Pending</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Automated Achievements (locked) */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">Automated Achievements</h3>
          <p className="text-gray-600 text-sm mb-4">
            These achievements are awarded automatically when you reach certain milestones.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {automatedAchievements.map(ach => (
              <div
                key={ach.id}
                className="border border-gray-200 p-3 text-center bg-gray-50 h-full flex flex-col items-center"
              >
                <img 
                  src={ach.imageUrl || '/achievements/default.png'} 
                  alt={ach.name}
                  className="w-14 h-14 rounded-full border border-gray-300 flex-shrink-0"
                />
                <h4 className="font-semibold text-gray-600 text-xs mt-2">{ach.name}</h4>
                <p className="text-xs text-gray-400 mt-1 flex-grow">{ach.description}</p>
                <span className="text-xs text-gray-400 mt-2 block">🔒 Locked</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-white border border-gray-300 shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="bg-[#2f3a2f] px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Request Achievement</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={selectedAchievement.imageUrl || '/achievements/default.png'} 
                  alt={selectedAchievement.name}
                  className="w-14 h-14 rounded-full border border-gray-300"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{selectedAchievement.name}</h4>
                  <p className="text-sm text-gray-600">{selectedAchievement.description}</p>
                </div>
              </div>

              <label className="block mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">Why do you deserve this achievement? (optional)</span>
                <textarea
                  value={requestNote}
                  onChange={e => setRequestNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 bg-white text-gray-900 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  rows={3}
                  placeholder="Provide any relevant information..."
                />
              </label>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
