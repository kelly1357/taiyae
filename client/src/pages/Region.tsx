import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ForumRegion, Thread } from '../types';
import NewThreadModal from '../components/NewThreadModal';
import RegionSelector from '../components/RegionSelector';

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
    <div className="relative min-h-screen">
      {region.imageUrl && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url('${region.imageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gray-900/50" />
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{region.name}</h1>
            <p className="text-gray-200 drop-shadow-md">{region.description}</p>
          </div>
          <div className="w-64">
            <RegionSelector />
          </div>
        </div>

        <section className="border border-gray-300 bg-white shadow-lg">
          <div className="bg-[#2f3a2f] px-4 py-2 flex justify-between items-center dark-header">
            <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Threads</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded text-xs font-bold uppercase tracking-wide shadow"
            >
              New Thread
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {threads.length > 0 ? (
              threads.map(thread => {
                return (
                  <div key={thread.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <Link to={`/thread/${thread.id}`} className="text-lg font-semibold text-blue-700 hover:text-blue-600 block">
                        {thread.title}
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">
                        Started by <span className="text-gray-800 font-medium">{thread.authorName || 'Unknown'}</span> · {new Date(thread.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{thread.replyCount} Replies</p>
                      <p>{thread.views} Views</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                No threads in this region yet. Be the first to post!
              </div>
            )}
          </div>
        </section>
      </div>

      <NewThreadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        regionId={region.id}
        regionName={region.name}
        onThreadCreated={fetchThreads}
      />
    </div>
  );
};

export default Region;
