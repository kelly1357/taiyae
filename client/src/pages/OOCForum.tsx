import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useOutletContext } from 'react-router-dom';
// import { createPortal } from 'react-dom';
import type { OOCForum, Thread, User } from '../types';
import NewThreadModal from '../components/NewThreadModal';
import { useBackground } from '../contexts/BackgroundContext';

interface ThreadSummary extends Omit<Thread, 'replies'> {
  authorName: string;
  authorSlug?: string;
  replyCount: number;
  isPinned?: boolean;
  subheader?: string;
  lastReplyAuthorName?: string;
  lastReplyAuthorSlug?: string;
  lastPostDate?: string;
}

interface LayoutContext {
  user?: User;
}

const OOCForumPage: React.FC = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const location = useLocation();
  const { user } = useOutletContext<LayoutContext>();
  const passedForum = (location.state as { forum?: OOCForum })?.forum;
  
  const [forum, setForum] = useState<OOCForum | null>(passedForum || null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(!passedForum);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pinningThreadId, setPinningThreadId] = useState<string | null>(null);
  const { resetBackground } = useBackground();

  const isModerator = user?.isModerator || user?.isAdmin;

  // Reset background on unmount (or set specific one if desired)
  useEffect(() => {
    return () => {
      resetBackground();
    };
  }, [resetBackground]);

  const handleTogglePin = async (threadId: string) => {
    setPinningThreadId(threadId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/pin`, { method: 'POST', headers: { 'X-Authorization': `Bearer ${token}` } });
      if (response.ok) {
        fetchThreads();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setPinningThreadId(null);
    }
  };

  const fetchThreads = () => {
    if (!forumId) return;
    fetch(`/api/threads?oocForumId=${forumId}`)
      .then(res => res.json())
      .then(data => {
        setThreads(data);
      });
  };

  useEffect(() => {
    if (!forumId) return;
    
    // Only fetch forum list if we didn't get it from navigation state
    if (!passedForum) {
      setLoading(true);
      fetch('/api/ooc-forums')
        .then(res => res.json())
        .then((data: OOCForum[]) => {
          const found = data.find(f => String(f.id) === forumId);
          setForum(found || null);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    // Fetch threads
    fetchThreads();
  }, [forumId, passedForum]);

  if (loading) return <div>Loading...</div>;
  if (!forum) return <div>Forum not found</div>;

  return (
    <>
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">{forum.title}</h2>
        </div>
        
        <div className="px-4 py-4">
          <div className="flex justify-between items-start mb-4">
            <div className="w-1/2">
              <h3 className="text-base font-semibold text-gray-900 mb-1">{forum.title}</h3>
              <p className="text-xs text-gray-600 html-description" dangerouslySetInnerHTML={{ __html: forum.description }} />
            </div>
            {user && forumId !== '7' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide shadow"
              >
                New Thread
              </button>
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
                            <Link to={`/thread/${thread.id}`} state={{ forum }} style={{ color: '#111827' }} className="hover:underline font-medium">
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
                      No threads in this forum yet. Be the first to post!
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
                        <Link to={`/thread/${thread.id}`} state={{ forum }} style={{ color: '#111827' }} className="hover:underline font-medium block">
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
                  No threads in this forum yet. Be the first to post!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <NewThreadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        oocForumId={forum.id.toString()}
        regionName={forum.title}
        onThreadCreated={fetchThreads}
        authorId={user?.id}
      />
    </>
  );
};

export default OOCForumPage;
