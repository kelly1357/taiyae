import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useParams, Link, useLocation, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { ForumRegion, Thread, Character } from '../types';
import NewThreadModal from '../components/NewThreadModal';
import { useBackground } from '../contexts/BackgroundContext';

// Extended type to match the API response which includes joined fields
interface ThreadSummary extends Omit<Thread, 'replies'> {
  authorName: string;
  replyCount: number;
}

interface RegionContext {
  activeCharacter?: Character;
}

const Region: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const location = useLocation();
  const { activeCharacter } = useOutletContext<RegionContext>();
  const passedRegion = (location.state as { region?: ForumRegion })?.region;
  
  const [region, setRegion] = useState<ForumRegion | null>(passedRegion || null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(!passedRegion);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const { setBackgroundUrl, resetBackground } = useBackground();

  // Set background immediately if we have region data from navigation state
  useLayoutEffect(() => {
    if (passedRegion?.imageUrl) {
      setBackgroundUrl(passedRegion.imageUrl);
    }
    return () => {
      resetBackground();
    };
  }, [passedRegion, setBackgroundUrl, resetBackground]);

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
                    <tr key={thread.id} className="hover:bg-gray-50 transition-colors border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300">
                        <Link to={`/thread/${thread.id}`} state={{ region }} style={{ color: '#111827' }} className="hover:underline font-medium">
                          {thread.title}
                        </Link>
                        {thread.subheader && (
                          <div className="text-xs text-gray-500 mt-0.5">{thread.subheader}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-r border-gray-300">
                        {thread.authorSlug ? (
                          <Link to={`/character/${thread.authorSlug}`} className="font-bold hover:underline" style={{ color: '#111827' }}>
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
                              <Link to={`/character/${thread.lastReplyAuthorSlug}`} className="font-bold hover:underline" style={{ color: '#111827' }}>
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
                  <div key={thread.id} className="border-b border-gray-300 p-3 hover:bg-gray-50">
                    <Link to={`/thread/${thread.id}`} state={{ region }} style={{ color: '#111827' }} className="hover:underline font-medium block">
                      {thread.title}
                    </Link>
                    {thread.subheader && (
                      <div className="text-xs text-gray-500 mt-0.5">{thread.subheader}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>by {thread.authorSlug ? (
                        <Link to={`/character/${thread.authorSlug}`} className="font-bold hover:underline" style={{ color: '#111827' }}>
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
                          <Link to={`/character/${thread.lastReplyAuthorSlug}`} className="font-bold hover:underline" style={{ color: '#6b7280' }}>
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
