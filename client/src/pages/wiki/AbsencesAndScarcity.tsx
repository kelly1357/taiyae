import React from 'react';
import { Link } from 'react-router-dom';

const AbsencesAndScarcity: React.FC = () => {
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
          <span>Absences and Scarcity</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Absences and Scarcity</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-none text-gray-800">
              {/* Main Section Header */}
              <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                Absences vs. Scarcity
              </h2>

              <p className="text-xs mb-6">
                If you know you're going to be gone or too busy to post for any period of time, 
                we encourage you to let fellow players know by either posting on the Absence board, 
                or proclaiming yourself Scarce.
              </p>

              {/* Going on Absence */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Going on Absence</h3>
              <p className="text-xs mb-4">
                If you're going to be gone for 7 days or longer, and if you do not plan to post during that time, 
                put yourself on absence. This allows other players to know you should be skipped in group threads 
                so that things are not held up.
              </p>
              <p className="text-xs mb-4">
                To go on absence, post in the Absences Board in OOC.
              </p>
              <p className="text-xs mb-6">
                Please note that being on absence won't protect your characters from going Inactive during an 
                activity check and being removed from the valley.
              </p>

              {/* Being Scarce */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Being Scarce</h3>
              <p className="text-xs mb-4">
                If you know you're going to be busy and unlikely to post, but if you still plan to post occasionally, 
                consider scarcity— this just lets people know that you might be slow to respond.
              </p>
              <p className="text-xs mb-4">
                Scarce players shouldn't be skipped outside of the constraints of the Three-Day Skip rule (see below) 
                without their written permission. To give permission for others to skip you (esp. useful in group threads!), 
                you can either post one sentence in that thread, post an OOC notice in the thread, or give consent over PM. 
                If you are scarce, please be aware that your threadmates may ask for your permission to be skipped!
              </p>
              <p className="text-xs mb-6">
                To become scarce, check the "Scarce?" box in your profile. If you want to give permission for others 
                to skip you without having to ask, check the "Skippable?" box.
              </p>

              {/* Three-Day Skip Rule */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Three-Day Skip Rule</h3>
              <p className="text-xs mb-4">
                In group threads, any player who takes longer than three days to post may be skipped by the next player 
                in the established posting order. This is called the Three-Day Skip rule. After being skipped, the player 
                may continue to be skipped and may rejoin the thread at any point if they return. This establishes a new 
                posting order.
              </p>
              <p className="text-xs mb-4">
                Note: If you are not next in line for posting order but wish to have the Three-Day Skip rule utilized, 
                reach out to the player who would be next in line and/or any other players in the thread to decide how 
                to proceed. Communication is key!
              </p>
              <p className="text-xs mb-4">
                The player who started the thread may also specify that there's no posting order or 'one post per round' 
                as necessary in group threads so they do not drag out unnecessarily.
              </p>
              <p className="text-xs mb-6">
                If a character is skipped or goes inactive during the course of a group thread, the remaining players 
                are free to come up with a vague powerplayed explanation for why that character dropped out (e.g. they 
                are left behind, are just standing by, have gone quiet, etc.)
              </p>

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

export default AbsencesAndScarcity;
