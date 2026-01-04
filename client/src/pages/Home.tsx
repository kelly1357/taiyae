import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ForumRegion } from '../types';

interface RegionStats {
  activeThreads: number;
  totalPosts: number;
  latestThread?: {
    id: string;
    title: string;
    authorName?: string;
    updatedAt: string;
    isOnline?: boolean;
  };
}

const Home: React.FC = () => {
  const [regions, setRegions] = useState<ForumRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionStats, setRegionStats] = useState<Record<string, RegionStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/region')
      .then(res => res.json())
      .then(data => {
        setRegions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch regions:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!regions.length) return;

    let cancelled = false;
    setStatsLoading(true);

    const loadStats = async () => {
      const entries = await Promise.all(
        regions.map(async (region) => {
          try {
            const response = await fetch(`/api/threads?regionId=${region.id}`);
            if (!response.ok) {
              throw new Error(`Failed to load threads for region ${region.id}`);
            }

            const threads: Array<{
              id: string;
              title: string;
              authorName?: string;
              updatedAt: string;
              replyCount: number;
              isOnline?: boolean;
            }> = await response.json();

            if (!Array.isArray(threads) || threads.length === 0) {
              return [region.id, { activeThreads: 0, totalPosts: 0 }] as const;
            }

            const totalPosts = threads.reduce((sum, thread) => sum + (thread.replyCount + 1), 0);
            const latestThread = threads[0];

            return [
              region.id,
              {
                activeThreads: threads.length,
                totalPosts,
                latestThread: {
                  id: latestThread.id,
                  title: latestThread.title,
                  authorName: latestThread.authorName,
                  updatedAt: latestThread.updatedAt,
                  isOnline: latestThread.isOnline,
                },
              },
            ] as const;
          } catch (error) {
            console.error(error);
            return [region.id, { activeThreads: 0, totalPosts: 0 }] as const;
          }
        })
      );

      if (!cancelled) {
        setRegionStats(Object.fromEntries(entries));
        setStatsLoading(false);
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [regions]);

  const regionImages: Record<string, string> = {
    'Eastern Wasteland': 'https://s3.amazonaws.com/HorizonRPG/layout/Eastern%20Wasteland.jpg',
    'Verdant Hills': 'https://web.archive.org/web/20181216142402im_/https://s3.amazonaws.com/HorizonRPG/layout/Verdant%20Hills.jpg',
  };

  if (loading) return <div className="text-center p-8">Loading regions...</div>;

  return (
    <div className="relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://taiyaefiles.blob.core.windows.net/web/home.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gray-900/50" />
      </div>

      <div className="space-y-8 relative z-10">
        <section className="border border-gray-300 bg-white">
          <div className="bg-[#2f3a2f] px-4 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
              Game Updates
            </h2>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Sitewide Updates</h3>
                <p className="mt-2 text-base leading-relaxed text-gray-800">
                  Welcome to the new Horizon! We have migrated to a new system.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-300 bg-white">
          <div className="bg-[#2f3a2f] px-4 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
              Roleplay Forums
            </h2>
          </div>

          <div>
            {regions.map((region) => {
              const stats = regionStats[region.id];
              const heroImage = regionImages[region.name];

              return (
                <div key={region.id} className="px-6 py-6">
                  {heroImage ? (
                    <div className="relative -mx-6">
                      <img
                        src={heroImage}
                        alt={`${region.name} landscape`}
                        className="w-full h-48 object-cover"
                      />
                      <Link
                        to={`/region/${region.id}`}
                        className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 text-lg font-semibold uppercase tracking-wide shadow"
                      >
                        {region.name}
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={`/region/${region.id}`}
                      className="text-xl font-semibold text-black mb-2 block"
                    >
                      {region.name}
                    </Link>
                  )}

                  <div className={`${heroImage ? '-mx-6' : 'mt-2'}`}>
                    <table className="w-full border border-gray-300 text-sm bg-white">
                      <thead>
                        <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                          <th className="w-1/2 px-4 py-2 text-left">Area Info</th>
                          <th className="w-1/2 px-4 py-2 text-left">Latest Post Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="align-top px-4 py-3 text-gray-800">
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold">Active Threads: </span>
                                {stats ? stats.activeThreads.toLocaleString() : statsLoading ? 'Loading…' : '—'}
                              </div>
                              <div>
                                <span className="font-semibold">Total Posts: </span>
                                {stats ? stats.totalPosts.toLocaleString() : statsLoading ? 'Loading…' : '—'}
                              </div>
                              {region.subareas.length > 0 && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold">Subareas: </span>
                                  {region.subareas.map((sub, index) => (
                                    <span key={sub.id}>
                                      <Link
                                        to={`/region/${region.id}/subarea/${sub.id}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {sub.name}
                                      </Link>
                                      {index < region.subareas.length - 1 && ' · '}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="align-top px-4 py-3 text-gray-800">
                            {stats?.latestThread ? (
                              <div className="space-y-1">
                                <Link
                                  to={`/thread/${stats.latestThread.id}`}
                                  className="font-semibold text-blue-700 hover:underline"
                                >
                                  {stats.latestThread.title}
                                </Link>
                                <div className="text-sm text-gray-700 flex items-center gap-1">
                                  by {stats.latestThread.authorName || 'Unknown'}
                                  {!!stats.latestThread.isOnline && (
                                    <span className="w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm" title="Online Now"></span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Updated {new Date(stats.latestThread.updatedAt).toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                {statsLoading ? 'Loading latest post…' : 'No threads yet'}
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
