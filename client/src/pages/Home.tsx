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

interface CharacterStats {
  totalCharacters: number;
  maleCount: number;
  femaleCount: number;
  pupsCount: number;
}

const Home: React.FC = () => {
  const [regions, setRegions] = useState<ForumRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionStats, setRegionStats] = useState<Record<string, RegionStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [characterStats, setCharacterStats] = useState<CharacterStats | null>(null);

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
              lastReplyAuthorName?: string;
              lastReplyIsOnline?: boolean;
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
                  authorName: latestThread.lastReplyAuthorName || latestThread.authorName,
                  updatedAt: latestThread.updatedAt,
                  isOnline: latestThread.lastReplyIsOnline ?? latestThread.isOnline,
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

  // Fetch character statistics
  useEffect(() => {
    fetch('/api/characters/stats')
      .then(res => res.json())
      .then(data => {
        setCharacterStats(data);
      })
      .catch(err => {
        console.error('Failed to fetch character stats:', err);
      });
  }, []);

  const regionImages: Record<string, string> = {
    'Eastern Wasteland': 'https://taiyaefiles.blob.core.windows.net/web/Eastern%20Wasteland%20Mini.jpg',
    'Verdant Hills': 'https://taiyaefiles.blob.core.windows.net/web/Verdant%20Hills%20Mini.jpg',
  };

  if (loading) return <div className="text-center p-8">Loading regions...</div>;

  return (
    <div className="space-y-8">
        <section className="border border-gray-300 bg-white">
          <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
            <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
              Game Updates
            </h2>
          </div>

          {/* Sitewide Updates and Plot News - side by side */}
          <div className="grid grid-cols-2 px-4 py-4">
            {/* Sitewide Updates */}
            <div className="pr-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Sitewide Updates</h3>
              <p className="text-sm text-gray-800 leading-relaxed">
                Welcome to the new Horizon! We have migrated to a new system.
              </p>
            </div>

            {/* Plot News */}
            <div className="pl-4 border-l border-gray-300">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Plot News</h3>
              <p className="text-sm text-gray-600 italic">None.</p>
            </div>
          </div>

          {/* Game Statistics */}
          <div className="px-4 py-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Game Statistics</h3>
            <div className="grid grid-cols-3 border border-gray-300 mx-0.5">
              {/* Setting */}
              <div className="border-r border-gray-300">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Setting
                  </h4>
                </div>
                <div className="px-4 py-4 text-sm text-gray-800">
                  <div className="font-semibold">Full Summer, HY0</div>
                  <div className="text-gray-600">Sunny · 90°F / 32°C</div>
                </div>
              </div>

              {/* Population */}
              <div className="border-r border-gray-300">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Population
                  </h4>
                </div>
                <div className="px-4 py-4 text-sm text-gray-800">
                  {characterStats ? (
                    <div className="space-y-1">
                      <div><span className="font-semibold">{characterStats.totalCharacters}</span> characters total</div>
                      <div className="text-gray-600">
                        {characterStats.maleCount} ♂ · {characterStats.femaleCount} ♀
                      </div>
                      {characterStats.pupsCount > 0 && (
                        <div className="text-gray-600">{characterStats.pupsCount} pups</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-600">Loading...</div>
                  )}
                </div>
              </div>

              {/* Packs */}
              <div>
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Packs
                  </h4>
                </div>
                <div className="px-4 py-4 text-sm text-gray-800">
                  <div className="text-gray-600 italic">Rogue</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-300 bg-white">
          <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
            <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
              Roleplay Forums
            </h2>
          </div>

          <div className="bg-gray-200 px-4 py-2">
            <span className="text-xs text-gray-700">View:</span>
          </div>

          <div>
            {regions.map((region) => {
              const stats = regionStats[region.id];
              const heroImage = regionImages[region.name];

              return (
                <div key={region.id} className="px-4 py-4">
                  {heroImage ? (
                    <Link to={`/region/${region.id}`} className="relative block cursor-pointer mx-0.5">
                      <img
                        src={heroImage}
                        alt={`${region.name} landscape`}
                        className="w-full h-48 object-cover"
                      />
                      <span
                        className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 text-lg font-semibold uppercase tracking-wide shadow"
                      >
                        {region.name}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to={`/region/${region.id}`}
                      className="text-xl font-semibold text-black mb-2 block"
                    >
                      {region.name}
                    </Link>
                  )}

                  <div className="mx-0.5">
                    <table className="w-full border border-gray-300 text-sm bg-white">
                      <thead>
                        <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                          <th className="w-1/3 px-4 py-2 text-left border-r border-gray-300">Area Info</th>
                          <th className="w-2/3 px-4 py-2 text-left">Latest Post Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
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
                                        className="text-gray-900 hover:underline"
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
                                  className="font-semibold text-gray-900 hover:underline"
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
  );
};

export default Home;
