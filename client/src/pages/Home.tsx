import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ForumRegion, OOCForum } from '../types';

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

interface ThreadItem {
  id: string;
  title: string;
  authorName?: string;
  regionId: string;
  regionName?: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  lastReplyAuthorName?: string;
  lastReplyIsOnline?: boolean;
}

interface LatestPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  threadId: string;
  threadTitle: string;
  regionId: string;
  regionName: string;
  authorName?: string;
  authorId?: string;
  authorImage?: string;
  packName?: string;
  isOnline?: boolean;
}

type ViewMode = 'areas' | 'active' | 'lonely' | 'latest';
type ThreadSortField = 'title' | 'date' | 'area';
type SortDirection = 'asc' | 'desc';

const Home: React.FC = () => {
  const [regions, setRegions] = useState<ForumRegion[]>([]);
  const [oocForums, setOocForums] = useState<OOCForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionStats, setRegionStats] = useState<Record<string, RegionStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [characterStats, setCharacterStats] = useState<CharacterStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('areas');
  const [allThreads, setAllThreads] = useState<ThreadItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadSortField, setThreadSortField] = useState<ThreadSortField>('date');
  const [threadSortDirection, setThreadSortDirection] = useState<SortDirection>('desc');
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [latestPostsLoading, setLatestPostsLoading] = useState(false);

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

    fetch('/api/ooc-forums')
      .then(res => res.json())
      .then(data => {
        setOocForums(data);
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  // Fetch all threads when switching to active or lonely view
  useEffect(() => {
    if ((viewMode !== 'active' && viewMode !== 'lonely') || !regions.length) return;
    
    setThreadsLoading(true);
    
    const fetchAllThreads = async () => {
      const allThreadsData: ThreadItem[] = [];
      
      for (const region of regions) {
        try {
          const response = await fetch(`/api/threads?regionId=${region.id}`);
          if (response.ok) {
            const threads = await response.json();
            threads.forEach((thread: any) => {
              allThreadsData.push({
                ...thread,
                regionName: region.name,
              });
            });
          }
        } catch (err) {
          console.error(`Failed to fetch threads for region ${region.id}:`, err);
        }
      }
      
      // Sort by most recent post
      allThreadsData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setAllThreads(allThreadsData);
      setThreadsLoading(false);
    };
    
    fetchAllThreads();
  }, [viewMode, regions]);

  // Fetch latest posts when switching to latest view
  useEffect(() => {
    if (viewMode !== 'latest') return;
    
    setLatestPostsLoading(true);
    
    fetch('/api/latest-posts')
      .then(res => res.json())
      .then(data => {
        setLatestPosts(data);
        setLatestPostsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch latest posts:', err);
        setLatestPostsLoading(false);
      });
  }, [viewMode]);

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
    fetch('/api/character-stats')
      .then(res => res.json())
      .then(data => {
        setCharacterStats(data);
      })
      .catch(err => {
        console.error('Failed to fetch character stats:', err);
      });
  }, []);

  const handleThreadSort = (field: ThreadSortField) => {
    if (threadSortField === field) {
      setThreadSortDirection(threadSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setThreadSortField(field);
      setThreadSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };

  const sortedThreads = useMemo(() => {
    return [...allThreads].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (threadSortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case 'area':
          aVal = (a.regionName || '').toLowerCase();
          bVal = (b.regionName || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return threadSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return threadSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allThreads, threadSortField, threadSortDirection]);

  const ThreadSortIcon = ({ field }: { field: ThreadSortField }) => {
    if (threadSortField !== field) {
      return (
        <svg className="ml-1 w-3 h-3 inline text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return threadSortDirection === 'asc' ? (
      <svg className="ml-1 w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const regionImages: Record<string, string> = {
    'Eastern Wasteland': 'https://taiyaefiles.blob.core.windows.net/web/Eastern%20Wasteland%20Mini.jpg',
    'Verdant Hills': 'https://taiyaefiles.blob.core.windows.net/web/Verdant%20Hills%20Mini.jpg',
    'Rolling Prairies': 'https://taiyaefiles.blob.core.windows.net/web/Rolling%20Prairies.jpg',
    'Cloudmirror Lake': 'https://taiyaefiles.blob.core.windows.net/web/Cloudmirror%20Lake.jpg',
    'Starlight Peaks': 'https://taiyaefiles.blob.core.windows.net/web/Starlight%20Peaks.jpg',
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
                  <img 
                    src="https://taiyaefiles.blob.core.windows.net/web/Early%20Summer.jpg" 
                    alt="Early Summer" 
                    className="float-left w-24 mr-3 mb-8 border border-gray-300"
                  />
                  <div className="font-semibold">Early Summer, HY0</div>
                  <div className="text-gray-600 flex items-center gap-1 mt-3 text-xs">
                    <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                    Sunny · 90°F / 32°C
                  </div>
                </div>
              </div>

              {/* Population */}
              <div className="border-r border-gray-300">
                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Population
                  </h4>
                </div>
                <div className="text-sm text-gray-800">
                  {characterStats ? (
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="px-2 py-2">
                            <span className="font-semibold">Wolves:</span> {characterStats.totalCharacters} <Link to="/characters" className="text-gray-500 hover:text-gray-700 text-xs">(view list)</Link>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="w-1/2 px-2 py-2 border-r border-gray-300">
                            <span className="text-blue-600">♂</span> {characterStats.maleCount}
                          </td>
                          <td className="w-1/2 px-2 py-2">
                            <span className="text-pink-500">♀</span> {characterStats.femaleCount}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-2 py-2">
                            <span className="font-semibold">Pups:</span> 0
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
                <div className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-4 py-px text-xs font-normal bg-gray-200 text-gray-600">R</span>
                    <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogues</span>
                  </div>
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

          <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-700 uppercase tracking-wider">View:</span>
            <button
              onClick={() => setViewMode('areas')}
              className={`text-xs uppercase tracking-wider ${viewMode === 'areas' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Areas
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => setViewMode('active')}
              className={`text-xs uppercase tracking-wider ${viewMode === 'active' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Active Threads
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => setViewMode('lonely')}
              className={`text-xs uppercase tracking-wider ${viewMode === 'lonely' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Lonely Threads
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => setViewMode('latest')}
              className={`text-xs uppercase tracking-wider ${viewMode === 'latest' ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Latest Posts
            </button>
          </div>

          {viewMode === 'areas' && (
          <div>
            {regions.map((region) => {
              const stats = regionStats[region.id];
              const heroImage = regionImages[region.name];

              return (
                <div key={region.id} className="px-4 py-4">
                  {heroImage ? (
                    <Link to={`/region/${region.id}`} state={{ region }} className="relative block cursor-pointer mx-0.5">
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
                      state={{ region }}
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
                                  state={{ region }}
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

            {oocForums.length > 0 && (
              <>
                <hr className="border-t border-gray-300 w-2/3 mx-auto my-[50px]" />
                <div className="px-4">
                  <div className="mx-0.5 bg-[#2f3a2f] px-4 py-2 dark-header">
                    <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
                      Out of Character
                    </h2>
                  </div>
                </div>
                
                {oocForums.map((forum) => (
                  <div key={forum.id} className="px-4">
                    <div className="mx-0.5">
                      <table className="w-full border border-gray-300 border-t-0 text-sm bg-white">
                        <thead>
                          <tr>
                            <th colSpan={2} className="bg-gray-200 px-4 py-2 text-left border-b border-gray-300">
                              <Link
                                to={`/ooc-forum/${forum.id}`}
                                state={{ forum }}
                                className="text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-gray-900"
                              >
                                {forum.title}
                              </Link>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300 w-2/3">
                              <p className="text-gray-600 html-description" dangerouslySetInnerHTML={{ __html: forum.description }} />
                            </td>
                            <td className="align-top px-4 py-3 text-gray-800 w-1/3">
                              {forum.latestThreadId ? (
                                <div className="space-y-1">
                                  <Link
                                    to={`/thread/${forum.latestThreadId}`}
                                    state={{ forum }}
                                    className="font-semibold text-gray-900 hover:underline"
                                  >
                                    {forum.latestThreadTitle}
                                  </Link>
                                  <div className="text-sm text-gray-700 flex items-center gap-1">
                                    by {forum.latestThreadAuthorName || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Updated {new Date(forum.latestThreadUpdatedAt!).toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">
                                  No threads yet
                                </div>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <div className="mb-[50px]"></div>
              </>
            )}
          </div>
          )}

          {/* Active Threads View */}
          {viewMode === 'active' && (
            <div className="px-4 py-4">
              {threadsLoading ? (
                <div className="text-gray-600 text-sm">Loading threads...</div>
              ) : sortedThreads.length === 0 ? (
                <div className="text-gray-600 text-sm">No active threads found.</div>
              ) : (
                <div className="mx-0.5">
                  <table className="w-full border border-gray-300 text-sm bg-white">
                    <thead>
                      <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                        <th 
                          className="w-1/2 px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                          onClick={() => handleThreadSort('title')}
                        >
                          Thread<ThreadSortIcon field="title" />
                        </th>
                        <th 
                          className="w-1/4 px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                          onClick={() => handleThreadSort('area')}
                        >
                          Area<ThreadSortIcon field="area" />
                        </th>
                        <th 
                          className="w-1/4 px-4 py-2 text-left cursor-pointer hover:bg-gray-300 select-none"
                          onClick={() => handleThreadSort('date')}
                        >
                          Latest Post<ThreadSortIcon field="date" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedThreads.map((thread) => {
                        const region = regions.find(r => r.id === thread.regionId);
                        return (
                          <tr key={thread.id} className="border-t border-gray-300">
                            <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
                              <Link
                                to={`/thread/${thread.id}`}
                                state={{ region }}
                                className="font-semibold text-gray-900 hover:underline"
                              >
                                {thread.title}
                              </Link>
                              <div className="text-xs text-gray-600">
                                by {thread.authorName || 'Unknown'} · {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                              </div>
                            </td>
                            <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
                              <Link
                                to={`/region/${thread.regionId}`}
                                state={{ region }}
                                className="text-gray-900 hover:underline"
                              >
                                {thread.regionName}
                              </Link>
                            </td>
                            <td className="align-top px-4 py-3 text-gray-800">
                              <div className="text-sm text-gray-700 flex items-center gap-1">
                                by {thread.lastReplyAuthorName || thread.authorName || 'Unknown'}
                                {!!thread.lastReplyIsOnline && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm" title="Online Now"></span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(thread.updatedAt).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Lonely Threads View */}
          {viewMode === 'lonely' && (
            <div className="px-4 py-4">
              {threadsLoading ? (
                <div className="text-gray-600 text-sm">Loading threads...</div>
              ) : (() => {
                const lonelyThreads = sortedThreads.filter(t => t.replyCount === 0);
                if (lonelyThreads.length === 0) {
                  return <div className="text-gray-600 text-sm">No lonely threads found. All threads have replies!</div>;
                }
                return (
                  <div className="mx-0.5">
                    <table className="w-full border border-gray-300 text-sm bg-white">
                      <thead>
                        <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                          <th 
                            className="w-1/2 px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                            onClick={() => handleThreadSort('title')}
                          >
                            Thread<ThreadSortIcon field="title" />
                          </th>
                          <th 
                            className="w-1/4 px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                            onClick={() => handleThreadSort('area')}
                          >
                            Area<ThreadSortIcon field="area" />
                          </th>
                          <th 
                            className="w-1/4 px-4 py-2 text-left cursor-pointer hover:bg-gray-300 select-none"
                            onClick={() => handleThreadSort('date')}
                          >
                            Posted<ThreadSortIcon field="date" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lonelyThreads.map((thread) => {
                          const region = regions.find(r => r.id === thread.regionId);
                          return (
                            <tr key={thread.id} className="border-t border-gray-300">
                              <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
                                <Link
                                  to={`/thread/${thread.id}`}
                                  state={{ region }}
                                  className="font-semibold text-gray-900 hover:underline"
                                >
                                  {thread.title}
                                </Link>
                                <div className="text-xs text-gray-600">
                                  by {thread.authorName || 'Unknown'}
                                </div>
                              </td>
                              <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
                                <Link
                                  to={`/region/${thread.regionId}`}
                                  state={{ region }}
                                  className="text-gray-900 hover:underline"
                                >
                                  {thread.regionName}
                                </Link>
                              </td>
                              <td className="align-top px-4 py-3 text-gray-800">
                                <div className="text-xs text-gray-500">
                                  {new Date(thread.createdAt).toLocaleString()}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Latest Posts View */}
          {viewMode === 'latest' && (
            <div className="px-4 py-4">
              {latestPostsLoading ? (
                <div className="text-gray-600 text-sm">Loading latest posts...</div>
              ) : latestPosts.length === 0 ? (
                <div className="text-gray-600 text-sm">No posts found.</div>
              ) : (
                <div className="space-y-4">
                  {latestPosts.map((post) => {
                    const region = regions.find(r => r.id === post.regionId);
                    // Strip HTML tags and truncate content for preview
                    const plainContent = post.content?.replace(/<[^>]*>/g, '') || '';
                    const truncatedContent = plainContent.length > 300 
                      ? plainContent.substring(0, 300) + '...' 
                      : plainContent;
                    
                    return (
                      <div key={post.id} className="bg-white">
                        {/* Quote content */}
                        <div className="px-4 py-3">
                          <div className="text-sm text-gray-700 leading-relaxed border-l-4 border-gray-300 pl-3 bg-gray-50 py-2">
                            {truncatedContent}
                          </div>
                          
                          {/* Attribution */}
                          <div className="mt-2 text-left">
                            <Link
                              to={`/thread/${post.threadId}`}
                              state={{ region }}
                              className="text-sm text-gray-700 hover:underline"
                            >
                              — {post.authorName || 'Unknown'}, {post.threadTitle}
                            </Link>
                            <div className="text-xs text-gray-500">
                              {new Date(post.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
    </div>
  );
};

export default Home;
