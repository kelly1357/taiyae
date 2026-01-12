import React from 'react';
import { Link } from 'react-router-dom';

interface Achievement {
  name: string;
  description: string;
  image: string;
}

const regularAchievements: Achievement[][] = [
  // Row 1
  [
    { name: '100 IC POSTS', description: 'Make 100 IC posts between all your characters', image: 'https://taiyaefiles.blob.core.windows.net/web/100posts.png' },
    { name: '250 IC POSTS', description: 'Make 250 IC posts between all your characters', image: 'https://taiyaefiles.blob.core.windows.net/web/250posts.png' },
    { name: '500 IC POSTS', description: 'Make 500 IC posts! Way to go!', image: 'https://taiyaefiles.blob.core.windows.net/web/500posts.png' },
    { name: '1000 IC POSTS', description: 'You are a posting god. Make 1000 IC posts!', image: 'https://taiyaefiles.blob.core.windows.net/web/1000posts.png' },
  ],
  // Row 2
  [
    { name: 'WELCOME GUIDE', description: 'Help welcome 10 new members by responding to their intro threads or posts', image: 'https://taiyaefiles.blob.core.windows.net/web/welcomeguide.png' },
    { name: '2 MONTHS', description: 'Be an active member of Horizon for two months', image: 'https://taiyaefiles.blob.core.windows.net/web/2mos.png' },
    { name: '6 MONTHS', description: 'Be an active member of Horizon for six months', image: 'https://taiyaefiles.blob.core.windows.net/web/6mos.png' },
    { name: '1 YEAR', description: 'Be an active member of Horizon for a year. Thanks for your loyalty!', image: 'https://taiyaefiles.blob.core.windows.net/web/1year.png' },
  ],
  // Row 3
  [
    { name: 'PLOT REPORTER', description: 'Submit 10 plot news updates', image: 'https://taiyaefiles.blob.core.windows.net/web/plotreporter.png' },
    { name: 'RECRUITER', description: 'Recruit 5 new members', image: 'https://taiyaefiles.blob.core.windows.net/web/recruiter.png' },
    { name: 'BUGS & SUGGESTIONS', description: 'Report 5 bugs/suggestions in OOC', image: 'https://taiyaefiles.blob.core.windows.net/web/bugsuggestion.png' },
    { name: 'ART MAKER', description: 'Make 5 avatars/photos for others in the community', image: 'https://taiyaefiles.blob.core.windows.net/web/artist.png' },
  ],
  // Row 4
  [
    { name: 'MOTM', description: 'Be voted Member of the Month (earn this on all accounts)', image: 'https://taiyaefiles.blob.core.windows.net/web/helper.png' },
    { name: 'COTM', description: 'Have a character who is voted Character of the Month', image: 'https://taiyaefiles.blob.core.windows.net/web/otm.png' },
    { name: 'FULL PROFILE', description: "Complete your character's profile", image: 'https://taiyaefiles.blob.core.windows.net/web/profile.png' },
    { name: 'SUPPORTER', description: 'Donate to our GoFundMe fund', image: 'https://taiyaefiles.blob.core.windows.net/web/supporter.png' },
  ],
  // Row 5
  [
    { name: 'LONELY THREADS', description: 'Respond to 10 lonely threads', image: 'https://taiyaefiles.blob.core.windows.net/web/lonelythreads.png' },
    { name: '100 OOC POSTS', description: 'Make 100 posts in the OOC forums', image: 'https://taiyaefiles.blob.core.windows.net/web/100ooc.png' },
    { name: '500 OOC POSTS', description: 'Make 500 posts in the OOC forums', image: 'https://taiyaefiles.blob.core.windows.net/web/500ooc.png' },
  ],
];

const Achievements: React.FC = () => {
  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/handbook" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>Achievements</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Achievements</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-none text-gray-800">
              {/* Overview Section */}
              <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                Overview
              </h2>
              <p className="text-xs mb-4">
                Achievements are a fun way of tracking your progress from an OOC standpoint. All 
                achievements you've earned will show up in the OOC section of your profile.
              </p>
              <p className="text-xs mb-4">
                Achievements are earned completely OOC, and have no bearing on in-game events. 
                They cannot be used to gain anything; they're simply for show :)
              </p>
              <p className="text-xs mb-6">
                As time goes on, we'll likely create "super" versions of these emblems for the 
                overachievers out there! New achievements will also be added for special occasions like holidays.
              </p>

              {/* How to Request Section */}
              <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                How to Claim
              </h2>
              <p className="text-xs mb-6">
                To claim an Achievement, go to our{' '}
                <Link to="/achievements" className="font-bold text-gray-900 hover:underline">
                  Achievement claims page
                </Link>{' '}
                and select the Achievement you have earned!{' '}
                <strong>Note:</strong> Some Achievements may be unlocked automatically.
              </p>

              {/* List Section */}
              <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                List
              </h2>

              {/* Achievement Grid */}
              <div className="mb-8">
                {regularAchievements.map((row, rowIndex) => {
                  const cols = row.length;
                  return (
                    <div key={rowIndex} className="border border-gray-300 border-b-0 last:border-b">
                      {/* Achievement Names Row */}
                      <div className={`grid bg-gray-100`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {row.map((achievement, colIndex) => (
                          <div 
                            key={colIndex} 
                            className={`p-2 text-center text-xs font-semibold text-gray-700 ${colIndex < cols - 1 ? 'border-r border-gray-300' : ''}`}
                          >
                            {achievement.name}
                          </div>
                        ))}
                      </div>
                      {/* Achievement Images Row */}
                      <div className={`grid border-t border-gray-300`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {row.map((achievement, colIndex) => (
                          <div 
                            key={colIndex} 
                            className={`p-3 flex justify-center ${colIndex < cols - 1 ? 'border-r border-gray-300' : ''}`}
                          >
                            <img 
                              src={achievement.image} 
                              alt={achievement.name} 
                              className="w-[36px] h-[36px]"
                            />
                          </div>
                        ))}
                      </div>
                      {/* Achievement Descriptions Row */}
                      <div className={`grid border-t border-gray-300`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {row.map((achievement, colIndex) => (
                          <div 
                            key={colIndex} 
                            className={`p-2 text-center text-xs text-gray-600 ${colIndex < cols - 1 ? 'border-r border-gray-300' : ''}`}
                          >
                            {achievement.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Categories */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 mb-2">Categories:</h4>
                <p className="text-xs">
                  • <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Handbook</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            {/* Search Box */}
            <div className="bg-white border border-stone-300 mb-4">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Search the Wiki
              </div>
              <div className="p-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-[#2f3a2f]"
                  />
                  <button
                    className="bg-[#2f3a2f] text-white px-4 py-2 text-sm hover:bg-[#3d4a3d] transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-stone-300">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Links
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li>
                    <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Index</Link>
                  </li>
                  <li>
                    <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">Game Overview</Link>
                  </li>
                  <li>
                    <Link to="/wiki/getting-started" className="text-[#2f3a2f] hover:underline">Getting Started</Link>
                  </li>
                  <li>
                    <Link to="/wiki/rules-compilation" className="text-[#2f3a2f] hover:underline">Rules: Compilation</Link>
                  </li>
                  <li>
                    <Link to="/wiki/faq" className="text-[#2f3a2f] hover:underline">FAQ</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Achievements;
