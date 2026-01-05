import React from 'react';
import { Link } from 'react-router-dom';

const RulesGeneral: React.FC = () => {
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
          <span>Rules: General</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rules: General</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="text-xs text-gray-800 mb-6">
              <p>When you join Horizon, you're indicating that you're going to follow our rules, which aim to keep the game fair and fun for all members:</p>
            </div>

            {/* Rules */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Rules</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-3">Basic Rules</h4>
              <ol className="list-decimal list-outside ml-5 mb-6 space-y-3">
                <li>
                  <strong>~The Golden Rule!~</strong><br />
                  Be polite, follow RP etiquette, and don't cheat.
                </li>
                <li>
                  <strong>Don't Plan OOC</strong><br />
                  Since we're a freeform game, Planning OOC is considered cheating, since it isn't fair to other members who let plots develop organically. Requesting threads with other players in OOC or in the Cbox, as well as reserving threads for specific characters, is considered OOC Planning and is not allowed.
                </li>
                <li>
                  <strong>Don't Game the System</strong><br />
                  Your goal shouldn't be to "win" — if it is, this game isn't for you, but check out some of our affiliates! Also, most things— especially things that will benefit your character— should be RPed out in the forums in actual posts. In general, Horizon is meant to be a challenging environment for characters, and as a player, you might not always get your way.
                </li>
                <li>
                  <strong>Respect the Game Lore</strong><br />
                  Don't violate the information in the Wiki, including the <strong>setting</strong> (it's set in the early 1900s in the wilderness) or the <strong>Wolf Guide</strong> (our wolves don't have powers).
                </li>
                <li>
                  <strong>Write Clearly</strong><br />
                  Please write in past tense, third-person, narrative style. Respect proper grammar, spelling, punctuation, and clarity, otherwise you might have a hard time finding RP partners.
                </li>
              </ol>

              <h4 className="font-semibold mb-3">Activity and Accounts</h4>
              <ol className="list-decimal list-outside ml-5 mb-6 space-y-3" start={6}>
                <li>
                  <strong>Activity</strong><br />
                  We hold <strong>Activity Checks</strong> every four weeks. If your character goes Inactive, it won't affect your posting permissions— though he/she may face IC consequences for disappearing. You can place yourself on Absence if you know you'll be away for a set amount of time.
                </li>
                <li>
                  <strong>Accounts</strong><br />
                  One character per account, properly capitalized. You can have as many character accounts as they can keep active. There is no wait period before you can create a new character.
                </li>
                <li>
                  <strong>No Canons</strong><br />
                  No canons, or wolf versions of canons, from other universes. Feel free to bring in your characters from other sites, but please keep in mind Rules 2, 3, and 4 above.
                </li>
                <li>
                  <strong>Three-Day Skip</strong><br />
                  In group threads, it's assumed that any player who takes longer than three days to post may be skipped by the next player in the established posting order. Skipped players can jump back in at any time, establishing a new posting order.
                </li>
                <li>
                  <strong>Fights & Forfeits</strong><br />
                  In fights, characters who don't respond within three days (excluding specific OOC circumstances) automatically forfeit the fight.
                </li>
              </ol>

              <h4 className="font-semibold mb-3">Other Stuff</h4>
              <ol className="list-decimal list-outside ml-5 mb-6 space-y-3" start={10}>
                <li>
                  <strong>Travel</strong><br />
                  RP your wolf's travel realistically. It takes around half a day IC to travel between IC areas.
                  <ul className="list-disc list-outside ml-5 mt-2 space-y-1">
                    <li>Pups cannot travel great distances without tiring quickly. This means that they shouldn't suddenly appear in territories far from home. Pups also shouldn't appear in locations far from their parents without IC progress of their travels, as this doesn't give parent players the opportunity to IC react and is unfair.</li>
                  </ul>
                </li>
                <li>
                  <strong>Skill Points</strong><br />
                  Skill points can only be claimed for finished threads, and cannot be claimed for dead threads. In order to warrant skill points, a thread must be archived. Check out the Skill Points guide in the Handbook for more information.
                </li>
                <li>
                  <strong>NPCs</strong><br />
                  In the interest of fairness, wolf NPCs and human NPCs not allowed in-game.
                </li>
                <li>
                  <strong>Howls</strong><br />
                  In our game, howls should not communicate messages— only emotions, location, or identity of the howler if known by the listener. In the case of confrontational threads, unless a wolf gives a distressed or urgent howl IC, characters should not suddenly pile up. This differs from situations such as pack meetings where wolves join over the course of multiple rounds.
                </li>
                <li>
                  <strong>Avatars & Profile Art</strong><br />
                  Avatars for the forums should be photos or photo manipulations only (no illustrations, please!) with no text. For avatars that are photo manipulations, please no glowing eyes or fully painted over fur. Fur color may be changed, but the original texture should be visible/not painted or smoothed over. This only applies specifically to avatars. However, feel free to include illustrations and other fan art in your profile.
                </li>
                <li>
                  <strong>No Postscripts</strong><br />
                  To keep things tidy, don't use postscripts, tables, graphics, or signatures in the forums.
                </li>
                <li>
                  <strong>No Sexual Violence</strong><br />
                  Roleplayed scenarios of sexual violence (including rape) are not allowed on Horizon. Characters may have mention of this in their history or thoughts, but it cannot be roleplayed here on Horizon.
                </li>
                <li>
                  <strong>Death</strong><br />
                  As a part of organic plots, no permission is needed to kill another character. Similarly, planning to have your wolf be killed by another character is not allowed.
                </li>
              </ol>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-200">
              <div>
                <span className="text-gray-500">Joining Guide:</span>
                <br />
                <span className="text-gray-500">← Back: </span>
                <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">Game Overview</Link>
              </div>
              <div className="text-right">
                <span className="text-gray-500">Next: </span>
                <Link to="/wiki/setting-overview" className="text-[#2f3a2f] hover:underline">Setting Overview</Link>
                <span className="text-gray-500"> →</span>
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

export default RulesGeneral;
