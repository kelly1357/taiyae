import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const OffscreenInteractions: React.FC = () => {
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
          <span>Offscreen Interactions</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Offscreen Interactions</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="offscreen-interactions"
              title="Offscreen Interactions"
              userId={user?.id}
            >
            {/* Intro */}
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Offscreen Interactions</h4>
              <p className="mb-3">Offscreen Interactions are those little day-to-day interactions that happen between your character's threads.</p>
              <p className="mb-3">Even though the premise of the game is that major plot points should happen IC and with minimal OOC planning of the future, it's okay to assume that characters have been interacting with others between threads, or offscreen in the past, to a reasonable degree.</p>
              <p className="mb-3">You are in no way required to offscreen. This is absolutely player preference, however, if you run into someone who does follow these, it's a nice guideline for navigating situations.</p>
              <p className="mb-3"><strong>How is this different than OOC planning?</strong></p>
              <p className="mb-3">OOC planning is planning events that will occur in the future, while offscreen interactions are assumed to have happened in the past. Specifically, OOC planning is planning out the events of a thread, while offscreen interactions are assumed to have happened before a thread.</p>
              <p className="mb-3">Offscreen events shouldn't be major plot points or life-changing events. For the most part, hunts, spars, and daily interaction are the most eventful things that should happen offscreen. As member Wash once said, "when in doubt, roleplay it out!"</p>
              <p>To keep things clear between both players involved in offscreen interactions, it's recommended to specify what's being assumed as offscreen at the start of a thread. Feel free to hash out offscreen interactions out over PM, Skype, or the medium of your choice :)</p>
            </div>

            {/* Examples of Things You Can Offscreen */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Examples of Things You Can Offscreen</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <ul className="list-disc list-outside ml-5 space-y-2">
                <li>Hunting behaviors</li>
                <li>Spars/training — these cannot create a super power wolf, any major skills must be earned IC</li>
                <li>Knowledge of births within packs</li>
                <li>Warning about dangerous wolves — vague terms</li>
                <li>Assumptions about behavior and direction of traveling companions</li>
                <li>Ongoing (but not initial) healing efforts</li>
                <li>General pack dynamics (change in leadership, ranks, etc.)</li>
                <li>If your wolf can smell it, they can offscreen it (i.e. wolves less present in the area, deaths, sick wolves, where your own pack's cache is, etc.)</li>
                <li>Shared info between mates/immediate family that spend reasonable time together (can be things like conversations had with other wolves, general information about other wolves, pack dynamic information, etc.)</li>
                <li>Knowing who your packmates are — names/basic appearance — after they have been in the pack a week or so, even if you have not directly met them</li>
                <li>Telling another individual you are leaving the area for a time (should be communicated OOC so players know whether or not to assume anyone knows the wolf has left or why)</li>
                <li>If a member kills off a character offscreen and gives OOC permissions for someone to find the body, said member can find it</li>
              </ul>
            </div>

            {/* Examples of Things You Cannot Offscreen */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Examples of Things You Cannot Offscreen</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <ul className="list-disc list-outside ml-5 space-y-2">
                <li>Passing of plot-changing information en mass</li>
                <li>Finding new locations</li>
                <li>Fights/arguments</li>
                <li>The building of relationships (ie, can't magically turn up as a couple without any screen time)</li>
                <li>Creating an offscreen mob</li>
                <li>Finding out where packs/caches are if you are not in that pack</li>
                <li>Finding dead bodies (with exception listed above)</li>
                <li>Specifics on why/how pack member ranks have changed</li>
                <li>Specifics on character deaths</li>
                <li>Wolves permanently leaving an area/pack</li>
                <li>Specifics on character illness</li>
                <li>Joining a pack</li>
                <li>Learning about herb uses</li>
                <li>Conspiring against known dangerous wolves</li>
                <li>Gaining details on information</li>
                <li>Specifics on births within packs, i.e. how many pups were born, gender, etc. while they're still in the den</li>
                <li>Any specific information about a pack if you are not a member (i.e. how many wolves are in the pack)</li>
              </ul>
            </div>

            {/* Staff Note */}
            <div className="text-xs text-gray-800 bg-gray-50 p-4 border-l-4 border-gray-300">
              <h4 className="font-semibold mb-2">Staff Note</h4>
              <p>This list is a work in progress. If you have any additions or confusion, please reach out to staff so we can further clarify or amend this!</p>
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

export default OffscreenInteractions;
