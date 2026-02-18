import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface PackMember {
  id: number;
  name: string;
  slug: string;
  sex: string;
  rankId: number;
  rankName: string;
  displayOrder: number;
}

interface PackRank {
  id: number;
  name: string;
  displayOrder: number;
}

interface Pack {
  id: number;
  name: string;
  slug: string;
  history: string;
  hierarchyExplanation: string;
  values: string;
  color1: string;
  color2: string;
  color1Name: string | null;
  color2Name: string | null;
  misc: string;
  isActive: boolean;
  foundedText: string | null;
  disbandedDate: string | null;
  stats: {
    pupsBorn: number;
    deaths: number;
    currentMales: number;
    currentFemales: number;
    currentPups: number;
  };
  ranks: PackRank[];
  subareas: { id: string; name: string }[];
  members: PackMember[];
  news: { id: number; title: string; content: string; createdAt: string }[];
  pastLeaders: { id: number; name: string; slug: string; startDate: string; endDate: string }[];
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

const PackPage: React.FC = () => {
  const { packSlug } = useParams<{ packSlug: string }>();
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);
  const [plotNews, setPlotNews] = useState<PlotNewsItem[]>([]);
  const [allPacks, setAllPacks] = useState<PackInfo[]>([]);

  useEffect(() => {
    if (!packSlug) return;
    
    // Fetch all packs for coloring tags
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => setAllPacks(data))
      .catch(err => console.error('Failed to fetch packs:', err));
    
    fetch(`/api/packs/${packSlug}`)
      .then(res => {
        if (!res.ok) throw new Error('Pack not found');
        return res.json();
      })
      .then(data => {
        setPack(data);
        setLoading(false);
        // Fetch plot news for this pack
        if (data?.name) {
          fetch(`/api/plot-news/pack/${encodeURIComponent(data.name)}`)
            .then(res => res.json())
            .then(newsData => setPlotNews(newsData))
            .catch(err => console.error('Failed to fetch plot news:', err));
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [packSlug]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!pack) return <div className="p-4">Pack not found</div>;

  // Group members by rank
  const membersByRank = pack.ranks.map(rank => ({
    rank,
    members: pack.members.filter(m => m.rankId === rank.id)
  }));

  // Members without a rank
  const unrankedMembers = pack.members.filter(m => !m.rankId);

  // Format stats display like "♂ 3 · ♀ 6" with colored symbols
  const statsDisplay = (
    <>
      <span className="text-blue-500">♂</span> {pack.stats.currentMales} · <span className="text-pink-500">♀</span> {pack.stats.currentFemales}
    </>
  );
  const statsDetails = `${pack.stats.currentPups} Pups · ${pack.stats.pupsBorn} Births · ${pack.stats.deaths} Deaths`;

  // Wiki-style h2 header
  const wikiHeaderClass = "text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4";

  // Bold section header for sidebar
  const sidebarHeaderClass = "text-sm font-bold text-gray-700 mb-3";

  return (
    <div className="bg-white border border-gray-200 p-4 md:p-6">
      {/* Disbanded Banner */}
      {!pack.isActive && (
        <div className="bg-gray-100 border border-gray-300 px-4 py-3 text-center mb-6">
          <span className="text-gray-700 font-semibold">
            This pack was disbanded on {new Date(pack.disbandedDate!).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Pack Title with gradient */}
      <h1 className="text-xl md:text-2xl uppercase tracking-wider mb-6" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>
        <span 
          style={{
            background: `linear-gradient(to right, ${pack.color1}, ${pack.color2 || pack.color1})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          {pack.name}
        </span>
      </h1>

      {/* Mobile: Statistics and Hierarchy at top */}
      <div className="md:hidden space-y-6 mb-8">
        {/* Pack Statistics Table - Mobile */}
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
              <tr className="border-b border-gray-200">
                <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs border-r border-gray-200">Territories</td>
                <td className="px-3 py-2 text-gray-700">
                  {pack.subareas.length > 0 ? (
                    pack.subareas.map((sub, index) => (
                      <span key={sub.id}>
                        <Link to={`/subarea/${sub.id}`} className="text-gray-900 hover:text-[#4b6596]">
                          {sub.name}
                        </Link>
                        {index < pack.subareas.length - 1 && ', '}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">None claimed</span>
                  )}
                </td>
              </tr>
              {pack.foundedText && (
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs border-r border-gray-200">Founded</td>
                  <td className="px-3 py-2 text-gray-700">{pack.foundedText}</td>
                </tr>
              )}
              <tr>
                <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs border-r border-gray-200">Colors</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="inline-block w-4 h-4 rounded-sm border border-gray-300" 
                      style={{ backgroundColor: pack.color1 }}
                      title={pack.color1Name || pack.color1}
                    />
                    <span 
                      className="inline-block w-4 h-4 rounded-sm border border-gray-300" 
                      style={{ backgroundColor: pack.color2 }}
                      title={pack.color2Name || pack.color2}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Hierarchy - Mobile (collapsible could be nice but keeping it simple) */}
        <section>
          <h3 className={sidebarHeaderClass}>Hierarchy</h3>
          <table className="w-full text-sm bg-gray-50 border border-gray-200">
            <tbody>
              {membersByRank.map(({ rank, members }) => (
                <React.Fragment key={rank.id}>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs">
                      {rank.name}
                    </td>
                  </tr>
                  {members.length > 0 ? (
                    members.map(member => (
                      <tr key={member.id} className="border-b border-gray-200">
                        <td className="px-3 py-2 pl-4">
                          <span className={member.sex === 'Male' ? 'text-blue-500' : 'text-pink-500'}>
                            {member.sex === 'Male' ? '♂' : '♀'}
                          </span>
                          {' '}
                          <Link to={`/character/${member.slug}`} className="text-gray-900 hover:text-[#4b6596]">
                            {member.name}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 pl-4 text-gray-400 italic">--</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {unrankedMembers.length > 0 && (
                <>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs">
                      Unranked
                    </td>
                  </tr>
                  {unrankedMembers.map(member => (
                    <tr key={member.id} className="border-b border-gray-200">
                      <td className="px-3 py-2 pl-4">
                        <span className={member.sex === 'Male' ? 'text-blue-500' : 'text-pink-500'}>
                          {member.sex === 'Male' ? '♂' : '♀'}
                        </span>
                        {' '}
                        <Link to={`/character/${member.slug}`} className="text-gray-900 hover:text-[#4b6596]">
                          {member.name}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* History - Full width, above the floated content */}
      {pack.history && (
        <section className="mb-8">
          <h2 className={wikiHeaderClass}>History</h2>
          <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: pack.history }} />
        </section>
      )}

      {/* Main layout with floating sidebar - Desktop only */}
      <div className="relative">
        {/* Floating right sidebar - Stats & Hierarchy - Hidden on mobile */}
        <aside className="hidden md:block float-right w-1/3 ml-6 mb-4 space-y-6">
          {/* Pack Statistics Table */}
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
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs border-r border-gray-200">Territories</td>
                  <td className="px-3 py-2 text-gray-700">
                    {pack.subareas.length > 0 ? (
                      pack.subareas.map((sub, index) => (
                        <span key={sub.id}>
                          <Link to={`/subarea/${sub.id}`} className="text-gray-900 hover:text-[#4b6596]">
                            {sub.name}
                          </Link>
                          {index < pack.subareas.length - 1 && ', '}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">None claimed</span>
                    )}
                  </td>
                </tr>
                {pack.foundedText && (
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs border-r border-gray-200">Founded</td>
                    <td className="px-3 py-2 text-gray-700">{pack.foundedText}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs border-r border-gray-200">Colors</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="group relative">
                        <span 
                          className="inline-block w-4 h-4 rounded-sm border border-gray-300 cursor-help" 
                          style={{ backgroundColor: pack.color1 }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {pack.color1Name || pack.color1}
                        </div>
                      </div>
                      <div className="group relative">
                        <span 
                          className="inline-block w-4 h-4 rounded-sm border border-gray-300 cursor-help" 
                          style={{ backgroundColor: pack.color2 }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {pack.color2Name || pack.color2}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Hierarchy - Member Roster */}
          <section>
            <h3 className={sidebarHeaderClass}>Hierarchy</h3>
            <table className="w-full text-sm bg-gray-50 border border-gray-200">
              <tbody>
                {membersByRank.map(({ rank, members }) => (
                  <React.Fragment key={rank.id}>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs">
                        {rank.name}
                      </td>
                    </tr>
                    {members.length > 0 ? (
                      members.map(member => (
                        <tr key={member.id} className="border-b border-gray-200">
                          <td className="px-3 py-2 pl-4">
                            <span className={member.sex === 'Male' ? 'text-blue-500' : 'text-pink-500'}>
                              {member.sex === 'Male' ? '♂' : '♀'}
                            </span>
                            {' '}
                            <Link to={`/character/${member.slug}`} className="text-gray-900 hover:text-[#4b6596]">
                              {member.name}
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 pl-4 text-gray-400 italic">--</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {unrankedMembers.length > 0 && (
                  <>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <td className="px-3 py-2 font-semibold text-gray-600 uppercase text-xs">
                        Unranked
                      </td>
                    </tr>
                    {unrankedMembers.map(member => (
                      <tr key={member.id} className="border-b border-gray-200">
                        <td className="px-3 py-2 pl-4">
                            <span className={member.sex === 'Male' ? 'text-blue-500' : 'text-pink-500'}>
                              {member.sex === 'Male' ? '♂' : '♀'}
                            </span>
                            {' '}
                            <Link to={`/character/${member.slug}`} className="text-gray-900 hover:text-[#4b6596]">
                              {member.name}
                            </Link>
                          </td>
                        </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </section>
        </aside>

        {/* Main content - flows around the floated sidebar */}
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

        {/* Information Section */}
        <section className="mb-8 overflow-hidden">
          <h3 className={sidebarHeaderClass}>Information</h3>
          <div className="space-y-6">
            {/* Hierarchy Explanation */}
            {pack.hierarchyExplanation && (
              <div>
                <h4 className={wikiHeaderClass}>Hierarchy</h4>
                <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: pack.hierarchyExplanation }} />
              </div>
            )}

            {/* Values */}
            {pack.values && (
              <div>
                <h4 className={wikiHeaderClass}>Values</h4>
                <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: pack.values }} />
              </div>
            )}

            {/* Past Leaders */}
            {pack.pastLeaders && pack.pastLeaders.length > 0 && (
              <div>
                <h4 className={wikiHeaderClass}>Past Leaders</h4>
                <div className="space-y-1">
                  {pack.pastLeaders.map(leader => (
                    <div key={leader.id} className="text-sm text-gray-700">
                      <Link to={`/character/${leader.slug}`} className="text-[#5c7c3b] hover:text-[#4a6530]">
                        {leader.name}
                      </Link>
                      <span className="text-gray-500 ml-2">
                        {new Date(leader.startDate).toLocaleDateString()} - {leader.endDate ? new Date(leader.endDate).toLocaleDateString() : 'Present'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Misc */}
            {pack.misc && (
              <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: pack.misc }} />
            )}
          </div>
        </section>

        {/* Clear the float */}
        <div className="clear-both"></div>
      </div>
    </div>
  );
};

export default PackPage;
