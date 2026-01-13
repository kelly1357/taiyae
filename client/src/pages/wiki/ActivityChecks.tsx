import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const ActivityChecks: React.FC = () => {
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
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/handbook" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>Activity Checks</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Activity Checks</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="activity-checks"
              title="Activity Checks"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="max-w-none text-gray-800">
              {/* Main Section Header */}
              <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                Activity Checks
              </h2>

              {/* Activity Tracker */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Activity Tracker</h3>
              <p className="text-xs mb-6">
                Use the Activity Check Tracker to keep up with your characters' activity status; this lists all characters 
                due to become Inactive on the next check date.
              </p>

              {/* Why, When, and How */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Why, When, and How</h3>
              <p className="text-xs mb-4">
                In Horizon, your character is considered active as long as you make one IC post with him/her every three weeks. 
                It is totally fine to have a combination of active and inactive characters.
              </p>
              <p className="text-xs mb-4">
                Activity checks are our way of keeping track of which players/characters are currently no longer on the site. 
                They keep everyone informed about which characters are still part of the game.
              </p>
              <ul className="text-xs mb-6 list-disc list-inside space-y-1">
                <li>Activity checks occur every third Sunday.</li>
                <li>As of each check, any character who hasn't posted since the past check becomes 'Inactive.'</li>
                <li>Threads with fewer than two active characters are marked either 'finished' (10+ posts) or 'dead' (fewer than 10 posts) and moved to the IC Archives. See below.</li>
              </ul>

              {/* IC Consequences */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">IC Consequences</h3>
              <p className="text-xs mb-4">
                When your character's account falls inactive, that character is assumed to have disappeared IC. This may result 
                in IC consequences if your character has certain responsibilities or is in a pack.
              </p>
              <p className="text-xs mb-6">
                When a pack wolf falls Inactive, his account loses its rank and position. This may not mean he is forbidden 
                from reentering the pack, but like everything else, all consequences for disappearance are determined In Character. 
                Other characters may have reactions to your wolf's absence or return.
              </p>

              {/* Reactivating your Character's Account */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Reactivating your Character's Account</h3>
              <p className="text-xs mb-6">
                When you log in as an Inactive character, you'll see a red bar beneath your character's avatar saying that the 
                character is currently inactive. To reactivate the character, first make an IC post (either as a new thread or 
                in response to a thread), and then post in Maintenance to have your character reactivated.
              </p>

              {/* Dead & Archived Threads */}
              <h3 className="text-sm font-semibold text-[#2f3a2f] mb-2">Dead & Archived Threads</h3>
              <p className="text-xs mb-4">
                If a thread has at least 10 posts, it will be marked "finished", and skill points can be claimed for it at any time. 
                Otherwise, it'll be marked "dead" if it has fewer than 10 posts.
              </p>
              <p className="text-xs mb-6">
                If a thread has died but you and another active player want to finish it out, it's okay to assume the Inactive 
                wolf/wolves have exited the thread. To bring back a thread from the dead, post in Maintenance.
              </p>
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

export default ActivityChecks;
