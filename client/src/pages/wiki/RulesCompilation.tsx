import React from 'react';
import { Link } from 'react-router-dom';

const RulesCompilation: React.FC = () => {
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
          <span>Rules: Compilation</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rules: Compilation</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="text-xs text-gray-800 mb-6">
              <p>We have an ever-expanding Wiki, and so, to make navigation easier for everyone, we're compiling links to major pages, citing smaller infractions, and making this a space for everything you need to know about Horizon's rules!</p>
            </div>

            {/* In Character */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">In Character</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">General</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>OOC plotting is not allowed in any capacity</li>
                <li>Godmodding, metagaming, powerplaying, etc. is not allowed. [<strong>More…</strong>]</li>
                <li>Fade to black or time warping is required for mating threads</li>
                <li>Characters cannot read the minds of other players' characters or inherently know another character is plotting without physical, tangible evidence [<strong>More…</strong>]</li>
                <li>Roleplayed scenarios of sexual violence (including rape) are not allowed on Horizon. Characters may have mention of this in their history or thoughts, but it cannot be roleplayed here on Horizon.</li>
              </ul>

              <h4 className="font-semibold mb-2">Characters</h4>
              <p className="mb-2">Generally speaking, this should be mostly common sense. With a few exceptions, if a wolf could not look, possess, or act within the physical bounds of a real wolf, it is most likely not going to be accepted.</p>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>The minimum age for a new character entering Horizon is 7 months</li>
                <li>Wolves may not enter the valley already pregnant</li>
                <li>Wolfdogs and <strong>certain subspecies</strong> of wolves not native to North America are not allowed</li>
                <li>Unusual fur or eye colors are not allowed. [<strong>More…</strong>]</li>
                <li>Cannot possess fantasy-type abilities</li>
                <li>No jewelry, clothing, potions, or the ability to carry around human items like bags, very limited tool use</li>
                <li>New characters not ICly born within the Horizon must have a birthplace outside the valley</li>
                <li>We don't allow wolves whose sole purpose in life is to rape, torture, or murder. Please be creative with your characters!</li>
              </ul>

              <h4 className="font-semibold mb-2">Setting</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>Each new year rolls over in Full Winter</li>
                <li>Travel from one area to the next takes a wolf one half day at an average pace (trot), not counting stops for rest or food. [<strong>More…</strong>]</li>
                <li>Wolf NPCs and human NPCs not allowed in-game</li>
                <li>Howls should not communicate messages— only emotions, general location, gender, or identity of the howler if known by the listener</li>
                <li>In the case of confrontational threads, unless a wolf gives a distressed or urgent howl IC, characters should not suddenly pile up. [<strong>More…</strong>]</li>
              </ul>

              <h4 className="font-semibold mb-2">Threads</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>All threads are considered <strong>"All Welcome"</strong>— there are no private threads or plotter pages</li>
                <li>Tagging or requesting threads is not allowed (with a handful of exceptions) [<strong>More…</strong>]</li>
                <li>Requesting threads with other players in OOC or in the Cbox, as well as reserving threads for specific characters, is considered OOC Planning and is not allowed</li>
                <li>Do not submit plot news unrelated to your characters</li>
                <li>Plot news should only be submitted after a thread is archived</li>
              </ul>

              <h4 className="font-semibold mb-2">Three-Day Skip Rule</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>In group threads, any player who takes longer than three days to post may be skipped by the next player in the established posting order. This is called the Three-Day Skip rule. [<strong>More…</strong>]</li>
                <li>In fights, characters who don't respond within three days (excluding specific OOC circumstances) automatically forfeit the fight</li>
              </ul>

              <h4 className="font-semibold mb-2">Fighting</h4>
              <p className="mb-2">Please view our <strong>master page</strong> on fighting for an in-depth guide.</p>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>Permission is not needed to start a fight or kill a character</li>
                <li>Fighting takes place turn-by-turn, with each post being one turn</li>
                <li>Only one totally successful evasive move (called a "full dodge") is allowed per opponent</li>
                <li>Wolves attack with their mouths foremost. Please note that wolf claws are not sharp and will not leave slices or gashes like a cat would</li>
                <li>Skull crushing is not a viable tactic in a fight</li>
              </ul>

              <h4 className="font-semibold mb-2">Offscreen Interaction</h4>
              <p>Offscreen events shouldn't be major plot points or life-changing events. For the most part, hunts, spars, and daily interaction are the most eventful things that should happen offscreen. [<strong>More…</strong>]</p>
            </div>

            {/* Out of Character */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Out of Character</h3>
            
            <div className="text-xs text-gray-800">
              <h4 className="font-semibold mb-2">General Rules</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>When you join Horizon, you're indicating that you're going to follow our rules, which aim to keep the game fair and fun for all members. Please take the time to go over our <strong>general rules</strong>!</li>
                <li>No posting tables or signatures</li>
              </ul>

              <h4 className="font-semibold mb-2">Recruitment</h4>
              <p className="mb-4">Please use the <strong>Advertising forum</strong> for any recruitment activity. If you are found recruiting in the cbox or via PM, you will either be given a strike or banned.</p>

              <h4 className="font-semibold mb-2">Three Strike Rule</h4>
              <p>If you are found consistently violating site rules, bullying, or refusing to work with staff, you will be <strong>given a strike</strong>. After the third strike, subject to staff decision, you will be banned from the site.</p>
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

export default RulesCompilation;
