import React from 'react';
import { Link } from 'react-router-dom';

const GettingStarted: React.FC = () => {
  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link to="/" className="text-[#2f3a2f] hover:underline">Home</Link>
          {' > '}
          <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Wiki</Link>
          {' > '}
          <span>Getting Started</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="text-xs text-gray-800 mb-6">
              <p>Welcome to Horizon! This guide will help you get your character set up, as well as help you get yourself oriented with the game. After taking the steps in this guide, you'll be ready to post your first thread (you can post before you do all this stuff, too— this is just to help you out!)</p>
            </div>

            {/* Tips for Getting Started */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Tips for Getting Started!</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <ol className="list-decimal list-outside ml-5 space-y-3">
                <li>
                  Re-read the <strong>Game Overview</strong> and <strong>Rules</strong> Handbook pages. In general, the <strong>Handbook</strong> (a subsection of the Wiki) is the go-to resource for official game information.
                </li>
                <li>
                  Finish setting up your avatar and profile (please note that you aren't required to set up your profile before posting!). You can view your profile by clicking on your avatar. To edit your profile, hover over the "No Avatar" image and click the "Edit Profile" button that appears. Don't have an avatar? Post in the <strong>Art board</strong> in OOC!
                </li>
                <li>
                  Check out the <strong>Skill Points (SP) Guide</strong> for a quick overview of what Skill Points are. Then, claim your starting Skill Points using the <strong>Starting SP form</strong>. Each adult wolf gets 100 SP to start. Your wolf will earn more SP as he completes threads.
                </li>
                <li>
                  Each wolf in Horizon has a Spirit Symbol (or alignment)— to find out your wolf's Spirit Symbol, take the <strong>Spirit Symbol Quiz</strong>, and then check out symbol information on the <strong>Spirit Symbols</strong> page.
                </li>
                <li>
                  Introduce yourself in the <strong>Icebreakers board</strong>, Horizon's welcoming board for all new and returning members! Horizon focuses heavily on IC happenings, but we're also a friendly community where everyone is welcome :)
                </li>
                <li>
                  Post your first thread! Check out the <strong>Setting Overview</strong> and our <strong>Map</strong> for basic information, or explore each area in the forums to find a good place to start. We always recommend checking out the <strong>Lonely Threads</strong> if you're unsure where to start, and remember, this is a sandbox, freeform site, so your wolf should be as new to the valley as you are!
                </li>
              </ol>
            </div>

            {/* Additional Tips for Gameplay */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Some Additional Tips for Gameplay!</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <ol className="list-decimal list-outside ml-5 space-y-3" start={7}>
                <li>
                  Remember, we strictly prohibit <strong>mind reading</strong>. If you're unclear about what exactly this means, we've written up some details for you.
                </li>
                <li>
                  Be sure to check out our handy <strong>Hunting Guide</strong> if you want some pointers on behavior. Hunting is a behavior that can be assumed <strong>offscreen</strong>, but if you want to play it out and get a few SP in the process, we've outlined the dos and don'ts for you.
                </li>
                <li>
                  Is your character already getting into some trouble? Check out our <strong>Official Guide on Fighting</strong> for tips and tricks that will make the process a little less of a hassle for you and your rival. Remember, communication is always helpful when in doubt. If you're unsure about something, reach out to the player you're roleplaying with or staff if that isn't something you're comfortable doing. Fights take practice, IC and OOC, and we're all here to support you along the way.
                </li>
              </ol>
            </div>

            <div className="text-xs text-gray-800">
              <p>That's it! Don't forget that you can always come to staff with questions. Happy adventuring! :)</p>
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

export default GettingStarted;
