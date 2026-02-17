import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { ForumSubarea, ForumRegion, Thread, Character } from '../types';
import NewThreadModal from '../components/NewThreadModal';
import { useBackground } from '../contexts/BackgroundContext';

// Extended type to match the API response which includes joined fields
interface ThreadSummary extends Omit<Thread, 'replies'> {
  authorName: string;
  replyCount: number;
  subheader?: string;
  authorSlug?: string;
  lastReplyAuthorName?: string;
  lastReplyAuthorSlug?: string;
  lastPostDate?: string;
}

interface SubareaContext {
  activeCharacter?: Character;
}

const Subarea: React.FC = () => {
  const { subareaId } = useParams<{ subareaId: string }>();
  const { activeCharacter } = useOutletContext<SubareaContext>();
  
  const [subarea, setSubarea] = useState<ForumSubarea | null>(null);
  const [parentRegion, setParentRegion] = useState<ForumRegion | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const { setBackgroundUrl, resetBackground } = useBackground();

  useEffect(() => {
    if (!subareaId) return;
    
    // Fetch regions to find the subarea and its parent
    fetch('/api/region')
      .then(res => res.json())
      .then((regions: ForumRegion[]) => {
        for (const region of regions) {
          const found = region.subareas?.find(s => s.id === subareaId);
          if (found) {
            setSubarea(found);
            setParentRegion(region);
            // Set background from subarea imageUrl
            if (found.imageUrl) {
              setBackgroundUrl(found.imageUrl);
            }
            break;
          }
        }
      });

    // Fetch threads for this subarea
    fetch(`/api/threads?subareaId=${subareaId}`)
      .then(res => res.json())
      .then(data => {
        setThreads(data);
        setLoading(false);
      });
  }, [subareaId, setBackgroundUrl]);

  // Cleanup background on unmount
  useLayoutEffect(() => {
    return () => {
      resetBackground();
    };
  }, [resetBackground]);

  if (loading) return <div>Loading...</div>;
  if (!subarea || !parentRegion) return <div>Subarea not found</div>;

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
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
            <Link to={`/region/${parentRegion.id}`} className="hover:text-white">{parentRegion.name}</Link>
            <span className="mx-2">›</span>
            {subarea.name}
          </h2>
        </div>
        
        <div className="px-4 py-4">
          <div className="flex justify-between items-start mb-4">
            <div className="w-1/2">
              <h3 className="text-base font-semibold text-gray-900 mb-1">{subarea.name}</h3>
              {subarea.description && (
                <p className="text-xs text-gray-600">{subarea.description}</p>
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
                    <tr key={thread.id} className="hover:bg-gray-50 transition-colors border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300">
                        <Link to={`/thread/${thread.id}`} state={{ subarea, parentRegion }} className="forum-link font-medium">
                          {thread.title}
                        </Link>
                        {thread.subheader && (
                          <div className="text-xs text-gray-500 mt-0.5">{thread.subheader}</div>
                        )}
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
                      No threads in this subarea yet. Be the first to post!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile card view */}
            <div className="md:hidden">
              {threads.length > 0 ? (
                threads.map(thread => (
                  <div key={thread.id} className="border-b border-gray-300 last:border-b-0 p-4">
                    <Link to={`/thread/${thread.id}`} state={{ subarea, parentRegion }} className="forum-link font-medium block mb-1">
                      {thread.title}
                    </Link>
                    {thread.subheader && (
                      <div className="text-xs text-gray-500 mb-2">{thread.subheader}</div>
                    )}
                    <div className="text-xs text-gray-600">
                      by {thread.authorSlug ? (
                        <Link to={`/character/${thread.authorSlug}`} className="forum-link font-bold">
                          {thread.authorName}
                        </Link>
                      ) : (
                        thread.authorName || 'Unknown'
                      )} · {thread.replyCount} replies
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No threads in this subarea yet. Be the first to post!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && activeCharacter && (
        <NewThreadModal
          isOpen={isModalOpen}
          regionId={parentRegion.id}
          subareaId={subarea.id}
          regionName={subarea.name}
          authorId={activeCharacter.id}
          onClose={() => setIsModalOpen(false)}
          onThreadCreated={() => {
            // Refresh threads after creating
            fetch(`/api/threads?subareaId=${subareaId}`)
              .then(res => res.json())
              .then(data => setThreads(data));
          }}
        />
      )}
    </>
  );
};

export default Subarea;
