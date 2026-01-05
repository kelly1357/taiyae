import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { ForumRegion, Thread } from '../types';
import NewThreadModal from '../components/NewThreadModal';

// Extended type to match the API response which includes joined fields
interface ThreadSummary extends Omit<Thread, 'replies'> {
  authorName: string;
  replyCount: number;
}

const Region: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const [region, setRegion] = useState<ForumRegion | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);

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
    setLoading(true);

    // Fetch region details (could be optimized to fetch single region)
    fetch('/api/region')
      .then(res => res.json())
      .then((data: ForumRegion[]) => {
        console.log('RegionId param:', regionId);
        console.log('API Data:', data);
        const found = data.find(r => String(r.id) === regionId);
        console.log('Found region:', found);
        setRegion(found || null);
      });

    // Fetch threads
    fetch(`/api/threads?regionId=${regionId}`)
      .then(res => res.json())
      .then(data => {
        setThreads(data);
        setLoading(false);
      });
  }, [regionId]);

  if (loading) return <div>Loading...</div>;
  if (!region) return <div>Region not found</div>;

  return (
    <>
      {/* Override the Layout background with region-specific image */}
      <style>{`
        .min-h-screen > div.fixed {
          background-image: url('${region.imageUrl || 'https://taiyaefiles.blob.core.windows.net/web/home.jpg'}') !important;
          background-position: center top !important;
        }
        ${showPhotoMode ? `
        .min-h-screen > header,
        .min-h-screen > main,
        .min-h-screen > footer {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        ` : ''}
      `}</style>

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
              <p className="text-xs text-gray-600">{region.description}</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide shadow"
            >
              New Thread
            </button>
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
                        <Link to={`/thread/${thread.id}`} style={{ color: '#111827' }} className="hover:underline font-medium">
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
                      No threads in this region yet. Be the first to post!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {!showPhotoMode && (
        <NewThreadModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          regionId={region.id}
          regionName={region.name}
          onThreadCreated={fetchThreads}
        />
      )}
    </>
  );
};

export default Region;
