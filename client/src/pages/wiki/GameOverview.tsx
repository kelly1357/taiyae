import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const GameOverview: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const isModerator = user?.isModerator || user?.isAdmin;
  const editorRef = useRef<WikiInlineEditorRef>(null);

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex items-center justify-between">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        {isModerator && (
          <button
            onClick={() => editorRef.current?.startEditing()}
            className="text-xs text-white/70 hover:text-white"
          >
            Edit Page
          </button>
        )}
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link to="/" className="text-[#2f3a2f] hover:underline">Home</Link>
          {' > '}
          <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Wiki</Link>
          {' > '}
          <span>Game Overview</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Game Overview</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="game-overview"
              title="Game Overview"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="max-w-none text-gray-800">
            {/* Header Image */}
            <div className="mb-8">
              <img 
                src="https://taiyaefiles.blob.core.windows.net/web/about2.jpg" 
                alt="Horizon Game Overview" 
                className="w-full max-w-2xl"
              />
            </div>

            {/* Genre & Setting */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Genre & Setting</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Genre</h4>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Realistic to semi-realistic wolf RPG</li>
                <li>Sandbox, Freeform, Simple</li>
                <li>Literate, no word count, shorter posts encouraged</li>
              </ul>

              <h4 className="font-semibold mb-2">Setting</h4>
              <p>Our characters inhabit a fictional region called the Horizon Valley, somewhere near the Pacific Northwest US and Canada border, and the year is 1908.</p>
            </div>

            {/* RP Style & Premise */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">RP Style & Premise</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">The world is your oyster!</h4>
              <p className="mb-3">Our game is Sandbox and Open-World, meaning that no sitewide plot is predetermined OOC, and your characters can do whatever they want within limits of the rules, setting, and lore.</p>
              
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>All threads are considered open— there are no private threads or plotter pages</li>
                <li>Tagging or requesting threads is not allowed (with a handful of exceptions)</li>
                <li>Speed {'>'} Quality {'>'} Quantity — we prefer shorter posts with minimal post-splicing</li>
              </ul>
            </div>

            {/* Plot */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Plot</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Freeform: create plots IC rather than OOC</h4>
              <p className="mb-3">The overarching plot is shaped by characters' in-game actions; the detail of the vast world of Horizon is provided, and you and your characters do the rest!</p>
              <p className="mb-4">Plotting OOC is highly discouraged, since the whole point of the game is to let plots develop organically in threads.</p>
              <p className="mb-3">Wondering what we consider OOC planning (and discourage), and what's fair game?</p>

              {/* Planning Table */}
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">IT'S FINE TO:</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">BUT IT'S NOT OKAY TO:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Speculate in OOC or in the Cbox about what a thread between characters might be like</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Plan out in your head (or worse, with someone else!) how a thread is going to be played out</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Ship two characters in a hypothetical/fan sense, like you would for TV characters</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Ship two characters and actually let the ship affect your character's actions and storyline</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Create backstories for adoptables, but leave their in-game stories open-ended</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Create backstories for adoptables, and plan out how they will interact with your character in-game</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Establish conclusions to threads OOC if you've already played out most of the action in a thread— e.g. "After the hunt (played out) they cached meat (not played out)"</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">Pretend significant events happened if you haven't played out any of the action yet— e.g. "Bob and Joe hunted together (not played out) and then cached meat (not played out)"</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-semibold mb-2">No tags allowed! (Mostly)</h4>
              <p className="mb-3">All threads are presumed open by default; we encourage you to throw your characters into threads however and whenever you please, as long as it makes sense according to their timelines! Feel free to PM the players involved in a thread if you're hesitant about interrupting, but for the most part, open threads are the lifeblood of our site.</p>
              <p className="mb-3">Requesting threads with other players in OOC or in the Cbox, as well as reserving threads for specific characters, is considered OOC Planning and is not allowed.</p>
              <p className="mb-3">However, there are a few special cases where tags are allowed:</p>
              
              <ol className="list-decimal list-inside mb-6 space-y-2">
                <li><strong>[Continuation]</strong> — A continuation of a thread in which your character is already traveling with another character</li>
                <li><strong>[Summons]</strong> — A thread that begins with your character summoning another character (e.g. howling)— in this case, you may PM that character to let them know they've been summoned</li>
                <li><strong>[Private]</strong> — 10+ posts only! This thread has progressed beyond a sensical point of entry for a new character to join in</li>
              </ol>

              <h4 className="font-semibold mb-2">Offscreen Interactions</h4>
              <p className="mb-3">Offscreen Interactions are those little day-to-day interactions that happen between your character's threads.</p>
              <p className="mb-3">Even though the premise of the game is that major plot points should happen IC and with minimal OOC planning of the future, it's okay to assume that characters have been interacting with others between threads, or offscreen in the past, to a reasonable degree.</p>
              <p className="mb-3"><strong>How is this different than OOC planning?</strong></p>
              <p className="mb-3">OOC planning is planning events that will occur in the future, while offscreen interactions are assumed to have happened in the past. Specifically, OOC planning is planning out the events of a thread, while offscreen interactions are assumed to have happened before a thread.</p>
              <p className="mb-3">Offscreen events shouldn't be major plot points or life-changing events. For the most part, hunts, spars, and daily interaction are the most eventful things that should happen offscreen. As member Wash once said, "when in doubt, roleplay it out!"</p>
              <p className="mb-3">Examples of stuff that should always be played out IC:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Initial meetings / introductions</li>
                <li>Declaring pack allegiance</li>
                <li>Major milestones in character romances (e.g. mating)</li>
              </ul>
              <p>To keep things clear between both players involved in offscreen interactions, it's recommended to specify what's being assumed as offscreen at the start of a thread. Feel free to hash out offscreen interactions out over PM, Skype, or the medium of your choice :)</p>
            </div>

            {/* About the Community */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">About the Community</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Board Culture</h4>
              <p>We're generally pretty chill; we're all more or less friends, realize that this is just a hobby, and the thought of OOC drama isn't really on our radar. Our member base generally hovers around people who are 18 and older. Many of us are busy college students or work full-time jobs. We play to create a story and watch the story and its characters grow over time.</p>
            </div>

            {/* About the Site Itself */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">About the Site Itself</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <p className="mb-3">We opened on June 8, 2014 after a year-long beta period.</p>
              <p className="mb-3">Some characters on Horizon come from a site called Taiyae, which lived on AvidGamers/Acornrack/Spleafnet and ended in 2008. Horizon is a continuation of that story under the same premise, but in a totally new setting and with mostly new characters. You do not have to have been a member at Taiyae to join Horizon! (In fact, we love new people in an almost creepy sort of way.)</p>
              <p>Horizon was built by Chels using ExpressionEngine and the Codeigniter PHP framework.</p>
            </div>
            </div>
            </WikiInlineEditor>
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

export default GameOverview;
