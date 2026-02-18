import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface RogueCharacter {
  id: number;
  name: string;
  slug: string;
  sex: string;
  age: string;
  status: string;
}

interface RogueData {
  characters: RogueCharacter[];
  stats: {
    total: number;
    males: number;
    females: number;
    pups: number;
  };
}

interface PlotNewsItem {
  PlotNewsID: number;
  PackName: string;
  NewsText: string;
  ThreadURL?: string;
  ThreadTitle?: string;
  ApprovedAt?: string;
  AllPackNames?: string;
}

interface PackInfo {
  id: number;
  name: string;
  color1: string;
  color2: string;
}

const Rogues: React.FC = () => {
  const [data, setData] = useState<RogueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [plotNews, setPlotNews] = useState<PlotNewsItem[]>([]);
  const [allPacks, setAllPacks] = useState<PackInfo[]>([]);

  useEffect(() => {
    // Fetch all packs for coloring tags
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => setAllPacks(data))
      .catch(err => console.error('Failed to fetch packs:', err));
    
    fetch('/api/rogues')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    
    // Fetch plot news for Rogues
    fetch('/api/plot-news/pack/Rogue')
      .then(res => res.json())
      .then(newsData => setPlotNews(newsData))
      .catch(err => console.error('Failed to fetch plot news:', err));
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!data) return <div className="p-4">Failed to load rogues</div>;

  // Format stats display like "♂ 3 · ♀ 6" with colored symbols
  const statsDisplay = (
    <>
      <span className="text-blue-500">♂</span> {data.stats.males} · <span className="text-pink-500">♀</span> {data.stats.females}
    </>
  );
  const statsDetails = `${data.stats.pups} Pups`;

  // Bold section header style
  const sidebarHeaderClass = "text-sm font-bold text-gray-700 mb-3";

  return (
    <div className="bg-white border border-gray-200 p-4 md:p-6">
      {/* Pack Title */}
      <h1 className="text-xl md:text-2xl uppercase tracking-wider mb-6 text-gray-700" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
        Rogues
      </h1>

      {/* Mobile: Statistics at top */}
      <div className="md:hidden mb-8">
        <section>
          <h3 className={sidebarHeaderClass}>Pack Statistics</h3>
          <table className="w-full text-sm bg-gray-50 border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs w-1/3 border-r border-gray-200">Stats</td>
                <td className="px-3 py-2 text-gray-700">
                  <div>{statsDisplay}</div>
                  <div className="text-xs text-gray-500">{statsDetails}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* Description text (no header) */}
      <section className="mb-8">
        <p className="text-sm text-gray-700">
          Rogues do not officially affiliate themselves with any pack. Rogues are Lone Wolves when they enter Horizon. A wolf's life can be difficult when he lives on his own, and many wolves cannot survive as loners for long. Rogues roam as they please across the entire valley of Horizon, but some stick to their favorite haunts. However, they may run into trouble if they cross claimed pack boundary lines.
        </p>
      </section>

      {/* Main layout with floating sidebar - Desktop only */}
      <div className="relative">
        {/* Floating right sidebar - Stats - Hidden on mobile */}
        <aside className="hidden md:block float-right w-1/3 ml-6 mb-4 space-y-6">
          {/* Pack Statistics Table */}
          <section>
            <h3 className={sidebarHeaderClass}>Pack Statistics</h3>
            <table className="w-full text-sm bg-gray-50 border border-gray-200">
              <tbody>
                <tr>
                  <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs w-1/3 border-r border-gray-200">Stats</td>
                  <td className="px-3 py-2 text-gray-700">
                    <div>{statsDisplay}</div>
                    <div className="text-xs text-gray-500">{statsDetails}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </aside>

        {/* Pack News section */}
        <section className="mb-8 overflow-hidden">
          <h3 className={sidebarHeaderClass}>Pack News</h3>
          <div className="p-4" style={{ backgroundColor: '#f2f2f2' }}>
            {plotNews.length > 0 ? (
              <div className="space-y-3">
                {plotNews.map(item => {
                  // Parse all pack names from the comma-separated string
                  const packNames = item.AllPackNames ? item.AllPackNames.split(',') : [item.PackName];
                  return (
                    <div key={item.PlotNewsID} className="text-sm text-gray-700">
                      {packNames.map(packName => {
                        const packInfo = allPacks.find(p => p.name === packName);
                        const isRogue = packName === 'Rogue';
                        const initials = isRogue ? 'R' : packName.split(' ').length > 1 ? packName.split(' ').map(w => w.charAt(0).toUpperCase()).join('') : packName.slice(0, 2).toUpperCase();
                        return (
                          <span 
                            key={packName}
                            className="inline-block w-7 text-center py-px text-xs font-normal mr-1"
                            style={packInfo ? { 
                              backgroundColor: `${packInfo.color1}30`, 
                              color: packInfo.color1 
                            } : { 
                              backgroundColor: '#e5e7eb', 
                              color: '#4b5563' 
                            }}
                          >
                            {initials}
                          </span>
                        );
                      })}
                      <span className="ml-1">{item.NewsText}</span>
                      {item.ThreadURL && (
                        <span className="text-gray-600">
                          {' '}
                          (<Link to={item.ThreadURL} className="text-gray-600 hover:text-gray-900 hover:underline font-bold">"{item.ThreadTitle || 'thread'}"</Link>)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">&nbsp;</p>
            )}
          </div>
        </section>

        {/* Clear the float */}
        <div className="clear-both"></div>
      </div>
    </div>
  );
};

export default Rogues;
