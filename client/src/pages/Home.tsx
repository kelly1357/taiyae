import React, { useEffect, useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { ForumRegion, OOCForum, User } from '../types';
import { getHorizonDate, formatHorizonYear } from '../utils/horizonCalendar';
import { getWeatherHistory } from '../utils/weatherGenerator';

// Helper function to format relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

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
  lastPostDate?: string;
  replyCount: number;
  lastReplyAuthorName?: string;
  lastReplyAuthorId?: number;
  lastReplyAuthorSlug?: string;
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

interface PlotNewsItem {
  PlotNewsID: number;
  PackName?: string;
  PackNames?: string;
  NewsText: string;
  ThreadURL?: string;
  ThreadTitle?: string;
  ApprovedAt?: string;
}

interface SitewideUpdate {
  UpdateID: number;
  Content: string;
  CreatedAt: string;
}

const Home: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const [regions, setRegions] = useState<ForumRegion[]>([]);
  const [oocForums, setOocForums] = useState<OOCForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState<CharacterStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('areas');
  const [allThreads, setAllThreads] = useState<ThreadItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadSortField, setThreadSortField] = useState<ThreadSortField>('date');
  const [threadSortDirection, setThreadSortDirection] = useState<SortDirection>('desc');
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [latestPostsLoading, setLatestPostsLoading] = useState(false);
  
  // Plot News state
  const [plotNews, setPlotNews] = useState<PlotNewsItem[]>([]);
  const [showPlotNewsModal, setShowPlotNewsModal] = useState(false);
  const [plotNewsForm, setPlotNewsForm] = useState({
    packNames: [] as string[],
    newsText: '',
    threadURL: '',
    threadTitle: ''
  });
  const [isSubmittingPlotNews, setIsSubmittingPlotNews] = useState(false);
  const [plotNewsMessage, setPlotNewsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulletin state
  const [bulletin, setBulletin] = useState<{ Content: string; IsEnabled: boolean } | null>(null);

  // Sitewide Updates state
  const [sitewideUpdates, setSitewideUpdates] = useState<SitewideUpdate[]>([]);

  // Packs state
  const [packs, setPacks] = useState<{ id: number; name: string; slug: string; color1: string; color2: string; isActive: boolean }[]>([]);

  // Check for season change and age characters if needed (runs once on page load)
  useEffect(() => {
    fetch('/api/season-check')
      .then(res => res.json())
      .then(data => {
        if (data.seasonChanged && data.phasesPassed > 0) {
          console.log(`Season changed to ${data.currentPhaseName}! ${data.charactersAged} characters aged.`);
        }
      })
      .catch(err => console.error('Season check failed:', err));
  }, []);

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

    // Fetch approved plot news
    fetch('/api/plot-news')
      .then(res => res.json())
      .then(data => {
        setPlotNews(data);
      })
      .catch(err => console.error('Failed to fetch plot news:', err));

    // Fetch bulletin
    fetch('/api/bulletin')
      .then(res => res.json())
      .then(data => {
        setBulletin(data);
      })
      .catch(err => console.error('Failed to fetch bulletin:', err));

    // Fetch sitewide updates (only 3 most recent)
    fetch('/api/sitewide-updates?limit=3')
      .then(res => res.json())
      .then(data => {
        setSitewideUpdates(data.updates || []);
      })
      .catch(err => console.error('Failed to fetch sitewide updates:', err));

    // Fetch packs
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        // Include all packs for tag coloring
        setPacks(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch packs:', err));

  }, []);

  // Handle plot news submission
  const handleSubmitPlotNews = async () => {
    if (!plotNewsForm.newsText.trim()) {
      setPlotNewsMessage({ type: 'error', text: 'Please enter plot news text.' });
      return;
    }
    if (plotNewsForm.packNames.length === 0) {
      setPlotNewsMessage({ type: 'error', text: 'Please select at least one pack.' });
      return;
    }
    
    setIsSubmittingPlotNews(true);
    setPlotNewsMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      // Submit one entry per pack
      for (const packName of plotNewsForm.packNames) {
        const response = await fetch('/api/plot-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            packName,
            newsText: plotNewsForm.newsText.trim(),
            threadURL: plotNewsForm.threadURL.trim() || null,
            threadTitle: plotNewsForm.threadTitle.trim() || null,
            userId: user?.id
          })
        });
        
        if (!response.ok) {
          const error = await response.text();
          setPlotNewsMessage({ type: 'error', text: error || 'Failed to submit plot news.' });
          setIsSubmittingPlotNews(false);
          return;
        }
      }
      
      setPlotNewsMessage({ type: 'success', text: 'Plot news submitted for review!' });
      setPlotNewsForm({ packNames: [], newsText: '', threadURL: '', threadTitle: '' });
      setTimeout(() => {
        setShowPlotNewsModal(false);
        setPlotNewsMessage(null);
      }, 2000);
    } catch (error) {
      setPlotNewsMessage({ type: 'error', text: 'Failed to submit plot news.' });
    } finally {
      setIsSubmittingPlotNews(false);
    }
  };

  // Fetch all threads when switching to active or lonely view
  useEffect(() => {
    if ((viewMode !== 'active' && viewMode !== 'lonely') || !regions.length) return;
    
    // Don't refetch if we already have threads
    if (allThreads.length > 0) return;
    
    setThreadsLoading(true);
    
    // Use the optimized single endpoint instead of fetching per-region
    fetch('/api/all-threads')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((threads: any[]) => {
        if (!Array.isArray(threads)) {
          console.error('Unexpected response format:', threads);
          setAllThreads([]);
          setThreadsLoading(false);
          return;
        }
        const allThreadsData: ThreadItem[] = threads.map(thread => ({
          ...thread,
          // regionName is now included in the API response
        }));
        setAllThreads(allThreadsData);
        setThreadsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch all threads:', err);
        setThreadsLoading(false);
      });
  }, [viewMode, regions, allThreads.length]);

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
          // Use lastPostDate if available, fall back to updatedAt
          aVal = new Date(a.lastPostDate || a.updatedAt).getTime();
          bVal = new Date(b.lastPostDate || b.updatedAt).getTime();
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
    'Moonrise Bay': 'https://taiyaefiles.blob.core.windows.net/web/Moonrise%20Bay.jpg',
    'Firefly Woods': 'https://taiyaefiles.blob.core.windows.net/web/Firefly%20Woods.jpg',
    'Evergreen Forest': 'https://taiyaefiles.blob.core.windows.net/web/Evergreen%20Forest.jpg',
    'Western Plains': 'https://taiyaefiles.blob.core.windows.net/web/Western%20Plains.jpg',
    'Falter Glen': 'https://taiyaefiles.blob.core.windows.net/web/Falter%20Glen.jpg',
    'Strongwind Range': 'https://taiyaefiles.blob.core.windows.net/web/Strongwind%20Range.jpg',
    'Skyrise Pass': 'https://taiyaefiles.blob.core.windows.net/web/Skyrise%20Pass.jpg',
    'Sundown Coast': 'https://taiyaefiles.blob.core.windows.net/web/Sundown%20Coast.jpg',
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

          {/* Bulletin Banner */}
          {bulletin && bulletin.IsEnabled && bulletin.Content && (
            <div className="bg-[#e5ebd4] px-4 py-3">
              <div className="text-gray-800 text-[13px] text-left">
                <span className="text-[#81973b]">• Bulletin—</span>{' '}
                <span 
                  className="bulletin-content"
                  dangerouslySetInnerHTML={{ __html: bulletin.Content }}
                />
              </div>
            </div>
          )}

          {/* Sitewide Updates and Plot News - side by side */}
          <div className="grid grid-cols-2 px-4 py-4">
            {/* Sitewide Updates */}
            <div className="pr-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Sitewide Updates</h3>
              {sitewideUpdates.length === 0 ? (
                <p className="text-sm text-gray-600 italic">No updates.</p>
              ) : (
                <div className="space-y-2">
                  {sitewideUpdates.map((update) => {
                    const date = new Date(update.CreatedAt);
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const year = date.getFullYear().toString().slice(-2);
                    let hours = date.getHours();
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
                    const formattedDate = `(${month}/${day}/${year}, ${hours}:${minutes}${ampm})`;
                    
                    return (
                      <div key={update.UpdateID} className="text-sm text-gray-800">
                        <span className="text-gray-500 font-bold uppercase">{formattedDate}</span>{' '}
                        <span className="homepage-news-content" dangerouslySetInnerHTML={{ __html: update.Content }} />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 text-sm">
                <Link to="/sitewide-updates" className="homepage-footer-link">All Updates</Link>
              </div>
            </div>

            {/* Plot News */}
            <div className="pl-4 border-l border-gray-300">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Plot News</h3>
              {plotNews.length === 0 ? (
                <p className="text-sm text-gray-600 italic">None.</p>
              ) : (
                <div className="space-y-2">
                  {/* Group plot news by content */}
                  {(() => {
                    const grouped = plotNews.reduce((acc, news) => {
                      const key = `${news.NewsText}||${news.ThreadURL || ''}`;
                      const newsPackNames = news.PackNames 
                        ? news.PackNames.split(',').map(s => s.trim()) 
                        : (news.PackName ? [news.PackName] : []);
                      if (!acc[key]) {
                        acc[key] = { ...news, packNames: [...newsPackNames] };
                      } else {
                        newsPackNames.forEach(pn => {
                          if (!acc[key].packNames.includes(pn)) {
                            acc[key].packNames.push(pn);
                          }
                        });
                      }
                      return acc;
                    }, {} as Record<string, PlotNewsItem & { packNames: string[] }>);
                    
                    return Object.values(grouped).map((news) => (
                      <div key={news.PlotNewsID} className="text-sm text-gray-800 homepage-news-content">
                        {news.packNames.map((packName) => {
                          const pack = packs.find(p => p.name === packName);
                          const isRogue = packName === 'Rogue';
                          const initials = isRogue ? 'R' : packName.split(' ').length > 1 ? packName.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : packName.slice(0, 2).toUpperCase();
                          return (
                            <span 
                              key={packName}
                              className="inline-block w-7 text-center py-px text-xs font-normal mr-1"
                              style={pack ? { 
                                backgroundColor: `${pack.color1}30`, 
                                color: pack.color1 
                              } : { 
                                backgroundColor: '#e5e7eb', 
                                color: '#4b5563' 
                              }}
                            >
                              {initials}
                            </span>
                          );
                        })}
                        <span className="ml-1">{news.NewsText}</span>
                        {news.ThreadURL && (
                          <span>
                            {' '}
                            (<a href={news.ThreadURL} target="_blank" rel="noopener noreferrer">"{news.ThreadTitle || 'thread'}"</a>)
                          </span>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
              <div className="mt-3 text-sm">
                <Link to="/plot-news" className="homepage-footer-link">View All</Link>
                {user && (
                  <>
                    <span className="mx-1 text-gray-500">|</span>
                    <button
                      onClick={() => setShowPlotNewsModal(true)}
                      className="homepage-footer-link"
                    >
                      Submit Plot News
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Game Statistics */}
          <div className="px-4 py-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Game Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-300 mx-0.5">
              {/* Setting */}
              <div className="md:border-r border-b md:border-b-0 border-gray-300">
                <div className="px-4 py-2 border-b border-gray-300" style={{ backgroundColor: '#f2f2f2' }}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Setting
                  </h4>
                </div>
                <div className="px-4 py-4 text-sm text-gray-800">
                  {(() => {
                    const horizonDate = getHorizonDate();
                    // Get today's actual weather
                    const currentWeek = getWeatherHistory(0)[0];
                    const today = new Date();
                    const todayWeather = currentWeek.days.find(d => d.date.toDateString() === today.toDateString()) || currentWeek.days[0];
                    return (
                      <>
                        <img 
                          src={horizonDate.phase.image} 
                          alt={horizonDate.phase.name} 
                          className="float-left w-24 mr-3 mb-8 border border-gray-300"
                        />
                        <div className="font-semibold">{horizonDate.phase.name}, {formatHorizonYear(horizonDate.year)}</div>
                        <div className="text-gray-600 flex items-center gap-1 mt-2 text-xs">
                          <span className="text-lg leading-none">{todayWeather.condition.icon}</span>
                          {todayWeather.condition.description} · {todayWeather.highTemp}°F / {todayWeather.lowTemp}°F
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-1">
                          <span className="text-lg leading-none invisible">{todayWeather.condition.icon}</span>
                          [<Link to="/weather" className="text-black hover:text-[#4b6596] font-bold">view full forecast</Link>]
                        </div>
                        <div className="text-gray-700 text-sm mt-8">
                          {horizonDate.daysUntilNextPhase} {horizonDate.daysUntilNextPhase === 1 ? 'day' : 'days'} until {horizonDate.nextPhase.name}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Population */}
              <div className="md:border-r border-b md:border-b-0 border-gray-300">
                <div className="px-4 py-2 border-b border-gray-300" style={{ backgroundColor: '#f2f2f2' }}>
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
                            <span className="font-semibold">Pups:</span> {characterStats.pupsCount}
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
                <div className="px-4 py-2 border-b border-gray-300" style={{ backgroundColor: '#f2f2f2' }}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Packs
                  </h4>
                </div>
                <div className="px-4 py-4 text-sm space-y-2">
                  {/* Rogues */}
                  <Link to="/rogues" className="flex items-center gap-2 hover:opacity-80">
                    <span className="inline-block w-7 text-center py-px text-xs font-normal bg-gray-200 text-gray-600">R</span>
                    <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
                      Rogues
                    </span>
                  </Link>
                  {/* Active Packs */}
                  {packs.filter(p => p.isActive).map(pack => (
                    <Link key={pack.id} to={`/pack/${pack.slug}`} className="flex items-center gap-2 hover:opacity-80">
                      <span 
                        className="inline-block w-7 text-center py-px text-xs font-normal text-white"
                        style={{ backgroundColor: `${pack.color1}99` }}
                      >
                        {pack.name.split(' ').length > 1 ? pack.name.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : pack.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span 
                        className="uppercase tracking-wide" 
                        style={{ 
                          fontFamily: 'Baskerville, "Times New Roman", serif',
                          background: `linear-gradient(to right, ${pack.color1}, ${pack.color2 || pack.color1})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {pack.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-gray-300 bg-white">
          <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
            <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
              Roleplay Forums | <a href="/wiki/map" className="font-bold text-white hover:underline">Map</a>
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
              // Use headerImageUrl from database if available, otherwise fall back to hardcoded map
              const heroImage = region.headerImageUrl || regionImages[region.name];

              return (
                <div key={region.id} className="px-4 py-4">
                  {heroImage ? (
                    <Link to={`/region/${region.slug || region.id}`} state={{ region }} className="relative block cursor-pointer mx-0.5">
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
                      to={`/region/${region.slug || region.id}`}
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
                                <span>
                                  <span className="font-semibold">{(region.activeThreadCount || 0).toLocaleString()}</span> active threads, <span className="font-semibold">{(region.postCount || 0).toLocaleString()}</span> posts
                                </span>
                              </div>
                              {region.subareas && region.subareas.length > 0 && (
                                <div className="text-sm text-gray-700 mt-3">
                                  <div>Subareas:</div>
                                  <div>
                                    {region.subareas.map((sub: { id: string; name: string }, index: number) => (
                                      <span key={sub.id}>
                                        <Link
                                          to={`/subarea/${sub.id}`}
                                          className="font-semibold text-gray-900 hover:text-[#4b6596]"
                                        >
                                          {sub.name}
                                        </Link>
                                        {index < region.subareas.length - 1 && ', '}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="align-top px-4 py-3 text-gray-800">
                            {region.latestThread ? (
                              <div className="space-y-1">
                                <Link
                                  to={`/thread/${region.latestThread.id}`}
                                  state={{ region }}
                                  className="font-semibold text-gray-900 hover:text-[#4b6596]"
                                >
                                  {region.latestThread.title}
                                </Link>
                                <div className="text-sm text-gray-700">
                                  by {region.latestThread.authorId ? (
                                    <Link to={`/character/${region.latestThread.authorId}`} className="font-bold hover:text-[#4b6596]">
                                      {region.latestThread.authorName || 'Unknown'}
                                    </Link>
                                  ) : (
                                    <span className="font-bold">{region.latestThread.authorName || 'Unknown'}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getRelativeTime(region.latestThread.updatedAt)}
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
                                className="text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-[#4b6596]"
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
                                    className="font-semibold text-gray-900 hover:text-[#4b6596]"
                                  >
                                    {forum.latestThreadTitle}
                                  </Link>
                                  <div className="text-sm text-gray-600">
                                    by {forum.latestThreadCharacterId ? (
                                      <Link to={`/character/${forum.latestThreadCharacterId}`} className="font-bold hover:text-[#4b6596]">
                                        {forum.latestThreadAuthorName || 'Unknown'}
                                      </Link>
                                    ) : (
                                      <span className="font-bold">{forum.latestThreadAuthorName || 'Unknown'}</span>
                                    )}, {getRelativeTime(forum.latestThreadUpdatedAt!)}
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
                                className="font-semibold text-gray-900 hover:text-[#4b6596]"
                              >
                                {thread.title}
                              </Link>
                              <div className="text-xs text-gray-600">
                                by {thread.authorName || 'Unknown'} · {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                              </div>
                            </td>
                            <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
                              <Link
                                to={`/region/${region?.slug || thread.regionId}`}
                                state={{ region }}
                                className="text-gray-900 hover:text-[#4b6596]"
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
                                  className="font-semibold text-gray-900 hover:text-[#4b6596]"
                                >
                                  {thread.title}
                                </Link>
                                <div className="text-xs text-gray-600">
                                  by {thread.authorName || 'Unknown'}
                                </div>
                              </td>
                              <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300">
                                <Link
                                  to={`/region/${region?.slug || thread.regionId}`}
                                  state={{ region }}
                                  className="text-gray-900 hover:text-[#4b6596]"
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
                              className="text-sm text-gray-700 hover:text-[#4b6596]"
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

      {/* Submit Plot News Modal */}
      {showPlotNewsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 shadow-lg w-full max-w-md mx-4">
            <div className="bg-[#2f3a2f] px-4 py-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Submit Plot News</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Pack Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Pack(s)</label>
                <div className="flex flex-col gap-2">
                  {/* Rogues */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plotNewsForm.packNames.includes('Rogue')}
                      onChange={(e) => setPlotNewsForm(prev => ({ 
                        ...prev, 
                        packNames: e.target.checked 
                          ? [...prev.packNames, 'Rogue'] 
                          : prev.packNames.filter(n => n !== 'Rogue')
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="inline-block w-7 text-center py-px text-xs font-normal bg-gray-200 text-gray-600">R</span>
                    <span className="uppercase tracking-wide text-gray-600 text-sm" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogues</span>
                  </label>
                  {/* Active Packs */}
                  {packs.filter(p => p.isActive).map(pack => (
                    <label key={pack.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plotNewsForm.packNames.includes(pack.name)}
                        onChange={(e) => setPlotNewsForm(prev => ({ 
                          ...prev, 
                          packNames: e.target.checked 
                            ? [...prev.packNames, pack.name] 
                            : prev.packNames.filter(n => n !== pack.name)
                        }))}
                        className="w-4 h-4"
                      />
                      <span 
                        className="inline-block w-7 text-center py-px text-xs font-normal text-white"
                        style={{ backgroundColor: `${pack.color1}99` }}
                      >
                        {pack.name.split(' ').length > 1 ? pack.name.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : pack.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span 
                        className="uppercase tracking-wide text-sm" 
                        style={{ 
                          fontFamily: 'Baskerville, "Times New Roman", serif',
                          background: `linear-gradient(135deg, ${pack.color1}, ${pack.color2})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {pack.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Plot News Text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Plot News</label>
                <textarea
                  value={plotNewsForm.newsText}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) {
                      setPlotNewsForm(prev => ({ ...prev, newsText: e.target.value }));
                    }
                  }}
                  placeholder="Enter your plot news update..."
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400 placeholder:italic"
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {plotNewsForm.newsText.length}/150 characters
                </div>
              </div>

              {/* Thread URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Thread</label>
                <input
                  type="url"
                  value={plotNewsForm.threadURL}
                  onChange={(e) => setPlotNewsForm(prev => ({ ...prev, threadURL: e.target.value }))}
                  placeholder="Thread URL"
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400 placeholder:italic"
                />
              </div>

              {/* Message */}
              {plotNewsMessage && (
                <div className={`text-sm ${plotNewsMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {plotNewsMessage.text}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowPlotNewsModal(false);
                    setPlotNewsMessage(null);
                    setPlotNewsForm({ packNames: [], newsText: '', threadURL: '', threadTitle: '' });
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isSubmittingPlotNews}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPlotNews}
                  disabled={isSubmittingPlotNews || plotNewsForm.packNames.length === 0 || !plotNewsForm.newsText.trim()}
                  className="px-4 py-2 text-sm bg-[#2f3a2f] text-white hover:bg-[#3a4a3a] disabled:opacity-50"
                >
                  {isSubmittingPlotNews ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
