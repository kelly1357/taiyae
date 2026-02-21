import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useParams, Link, useLocation, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { ForumRegion, Thread, Character, User } from '../types';
import NewThreadModal from '../components/NewThreadModal';
import { useBackground } from '../contexts/BackgroundContext';

// Extended type to match the API response which includes joined fields
interface ThreadSummary extends Omit<Thread, 'replies'> {
  authorName: string;
  replyCount: number;
  isPinned?: boolean;
  subheader?: string;
  authorSlug?: string;
  lastReplyAuthorName?: string;
  lastReplyAuthorSlug?: string;
  lastPostDate?: string;
}

interface RegionContext {
  activeCharacter?: Character;
  user?: User;
}

const Region: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const location = useLocation();
  const { activeCharacter, user } = useOutletContext<RegionContext>();
  const passedRegion = (location.state as { region?: ForumRegion })?.region;
  
  const [region, setRegion] = useState<ForumRegion | null>(passedRegion || null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(!passedRegion);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [pinningThreadId, setPinningThreadId] = useState<string | null>(null);
  const { setBackgroundUrl, resetBackground } = useBackground();

  const isModerator = user?.isModerator || user?.isAdmin;

  // Set background immediately if we have region data from navigation state
  useLayoutEffect(() => {
    if (passedRegion?.imageUrl) {
      setBackgroundUrl(passedRegion.imageUrl);
    }
    return () => {
      resetBackground();
    };
  }, [passedRegion, setBackgroundUrl, resetBackground]);

  const handleTogglePin = async (threadId: string) => {
    setPinningThreadId(threadId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/pin`, { method: 'POST', headers: { 'X-Authorization': `Bearer ${token}` } });
      if (response.ok) {
        fetchThreads();
      } else if (response.status === 401) {
        alert('Your session has expired. Please log out and log back in.');
      } else {
        const errText = await response.text().catch(() => response.statusText);
        alert(`Failed to toggle pin: ${errText}`);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setPinningThreadId(null);
    }
  };

  const fetchThreads = () => {
    if (!regionId) return;
    fetch(`/api/threads?regionId=${regionId}`)
      .then(res => res.json())
      .then(data => {
        setThreads(data);
      });
  };

  useEffect(() => {
    if (!regionId) return;
    
    // Only fetch region data if we didn't get it from navigation state
    if (!passedRegion) {
      setLoading(true);
      fetch('/api/region')
        .then(res => res.json())
        .then((data: ForumRegion[]) => {
          const found = data.find(r => String(r.id) === regionId);
          setRegion(found || null);
          // Set the background when region data loads
          if (found?.imageUrl) {
            setBackgroundUrl(found.imageUrl);
          }
        });
    }

    // Fetch threads
    fetch(`/api/threads?regionId=${regionId}`)
      .then(res => res.json())
      .then(data => {
        setThreads(data);
        setLoading(false);
      });
  }, [regionId, passedRegion, setBackgroundUrl]);

  if (loading) return <div>Loading...</div>;
  if (!region) return <div>Region not found</div>;

  return (
    <>
      {/* Photo mode styles */}
      {showPhotoMode && (
        <style>{`
          .min-h-screen > header,
          .min-h-screen > main,
          .min-h-screen > footer {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
      )}

      {/* Show Photo Button - rendered via portal to body */}
      {createPortal(
        <button
          onClick={() => setShowPhotoMode(!showPhotoMode)}
          className="show-photo-btn"
        >
          {showPhotoMode ? 'Hide Photo' : 'Show Photo'}
        </button>,
        document.body
      )}

      <section className={`bg-white border border-gray-300 shadow ${showPhotoMode ? 'invisible' : ''}`}>
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">{region.name}</h2>
        </div>
        
        <div className="px-4 py-4">
          <div className="flex justify-between items-start mb-4">
            <div className="w-1/2">
              <h3 className="text-base font-semibold text-gray-900 mb-1">{region.name}</h3>
              <p className="text-xs text-gray-600 html-description" dangerouslySetInnerHTML={{ __html: region.description }} />
              {region.subareas && region.subareas.length > 0 && (
                <p className="text-xs text-gray-600 mt-6">
                  <span>Subareas: </span>
                  {region.subareas.map((sub, index) => (
                    <span key={sub.id}>
                      <Link to={`/subarea/${sub.id}`} className="font-semibold text-gray-900 hover:text-[#4b6596]">
                        {sub.name}
                      </Link>
                      {index < region.subareas.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              )}
            </div>
            {activeCharacter && activeCharacter.status !== 'Dead' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide shadow"
              >
                New Thread
              </button>
            )}
            {activeCharacter && activeCharacter.status === 'Dead' && (
              <span className="text-xs text-gray-500 italic">
                Dead characters cannot create threads in roleplay regions.
              </span>
            )}
          </div>

          <div className="border border-gray-300 mx-0.5 overflow-x-auto">
            {/* Desktop table view */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                  <th className="px-4 py-2 text-left border-r border-gray-300">Thread Title</th>
                  <th className="px-4 py-2 text-left border-r border-gray-300 w-36">Author</th>
                  <th className="px-4 py-2 text-center border-r border-gray-300 w-16">Replies</th>
                  <th className="px-4 py-2 text-center w-52">Latest Post</th>
                </tr>
              </thead>
              <tbody>
                {threads.length > 0 ? (
                  threads.map(thread => (
                    <tr key={thread.id} className={`hover:bg-gray-50 transition-colors border-t border-gray-300 ${thread.isPinned ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3 border-r border-gray-300">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <Link to={`/thread/${thread.id}`} state={{ region }} className="forum-link font-medium">
                              {thread.isPinned && <span className="text-gray-400 uppercase text-xs mr-1">(Sticky)</span>}
                              {thread.title}
                            </Link>
                            {thread.subheader && (
                              <div className="text-xs text-gray-500 mt-0.5">{thread.subheader}</div>
                            )}
                          </div>
                          {isModerator && (
                            <button
                              onClick={() => handleTogglePin(thread.id)}
                              disabled={pinningThreadId === thread.id}
                              className={`text-xs px-2 py-1 rounded ${thread.isPinned ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} ${pinningThreadId === thread.id ? 'opacity-50 cursor-wait' : ''}`}
                              title={thread.isPinned ? 'Unpin thread' : 'Pin thread'}
                            >
                              {pinningThreadId === thread.id ? '...' : (thread.isPinned ? 'Unpin' : 'Pin')}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-r border-gray-300">
                        {thread.authorSlug ? (
                          <Link to={`/character/${thread.authorSlug}`} className="forum-link font-bold">
                            {thread.authorName}
                          </Link>
                        ) : (
                          thread.authorName || 'Unknown'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-300">
                        {thread.replyCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 text-xs whitespace-nowrap">
                        {thread.lastReplyAuthorName && thread.lastPostDate ? (
                          <>
                            {thread.lastReplyAuthorSlug ? (
                              <Link to={`/character/${thread.lastReplyAuthorSlug}`} className="forum-link font-bold">
                                {thread.lastReplyAuthorName}
                              </Link>
                            ) : (
                              <span className="font-bold">{thread.lastReplyAuthorName}</span>
                            )} @ {new Date(thread.lastPostDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}, {new Date(thread.lastPostDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 border-t border-gray-300">
                      No threads in this region yet. Be the first to post!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile card view */}
            <div className="md:hidden">
              {threads.length > 0 ? (
                threads.map(thread => (
                  <div key={thread.id} className={`border-b border-gray-300 p-3 hover:bg-gray-50 ${thread.isPinned ? 'bg-amber-50' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <Link to={`/thread/${thread.id}`} state={{ region }} className="forum-link font-medium block">
                          {thread.isPinned && <span className="text-gray-400 uppercase text-xs mr-1">(Sticky)</span>}
                          {thread.title}
                        </Link>
                        {thread.subheader && (
                          <div className="text-xs text-gray-500 mt-0.5">{thread.subheader}</div>
                        )}
                      </div>
                      {isModerator && (
                        <button
                          onClick={() => handleTogglePin(thread.id)}
                          disabled={pinningThreadId === thread.id}
                          className={`text-xs px-2 py-1 rounded ${thread.isPinned ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} ${pinningThreadId === thread.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={thread.isPinned ? 'Unpin thread' : 'Pin thread'}
                        >
                          {pinningThreadId === thread.id ? '...' : (thread.isPinned ? 'Unpin' : 'Pin')}
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>by {thread.authorSlug ? (
                        <Link to={`/character/${thread.authorSlug}`} className="forum-link font-bold">
                          {thread.authorName}
                        </Link>
                      ) : (
                        thread.authorName || 'Unknown'
                      )}</span>
                      <span>{thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}</span>
                    </div>
                    {thread.lastReplyAuthorName && thread.lastPostDate && (
                      <div className="text-xs text-gray-400 mt-1">
                        Latest: {thread.lastReplyAuthorSlug ? (
                          <Link to={`/character/${thread.lastReplyAuthorSlug}`} className="forum-link font-bold">
                            {thread.lastReplyAuthorName}
                          </Link>
                        ) : (
                          <span className="font-bold">{thread.lastReplyAuthorName}</span>
                        )} @ {new Date(thread.lastPostDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}, {new Date(thread.lastPostDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  No threads in this region yet. Be the first to post!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!showPhotoMode && activeCharacter && (
        <NewThreadModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          regionId={region.id}
          regionName={region.name}
          onThreadCreated={fetchThreads}
          authorId={activeCharacter?.id}
        />
      )}
    </>
  );
};

export default Region;
