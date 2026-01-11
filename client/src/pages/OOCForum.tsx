import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useOutletContext } from 'react-router-dom';
// import { createPortal } from 'react-dom';
import type { OOCForum, Thread, User } from '../types';
import NewThreadModal from '../components/NewThreadModal';
import { useBackground } from '../contexts/BackgroundContext';

interface ThreadSummary extends Omit<Thread, 'replies'> {
  authorName: string;
  replyCount: number;
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
  const { resetBackground } = useBackground();

  // Reset background on unmount (or set specific one if desired)
  useEffect(() => {
    return () => {
      resetBackground();
    };
  }, [resetBackground]);

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

          <div className="border border-gray-300 mx-0.5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                  <th className="px-4 py-2 text-left border-r border-gray-300">Thread</th>
                  <th className="px-4 py-2 text-left border-r border-gray-300 w-32">Author</th>
                  <th className="px-4 py-2 text-center border-r border-gray-300 w-20">Replies</th>
                  <th className="px-4 py-2 text-center w-20">Views</th>
                </tr>
              </thead>
              <tbody>
                {threads.length > 0 ? (
                  threads.map(thread => (
                    <tr key={thread.id} className="hover:bg-gray-50 transition-colors border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300">
                        <Link to={`/thread/${thread.id}`} state={{ forum }} style={{ color: '#111827' }} className="hover:underline font-medium">
                          {thread.title}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-r border-gray-300">
                        {thread.authorName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-300">
                        {thread.replyCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {thread.views}
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
