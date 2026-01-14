import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const ThreeStrikeRule: React.FC = () => {
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
          <span>Three Strike Rule</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Three Strike Rule</h1>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="three-strike-rule"
              title="Three Strike Rule"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="text-xs text-gray-800 space-y-4">
              {/* THREE-STRIKE RULE */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Three-Strike Rule</h3>
              
              <p>
                The Three-Strike Rule is fairly straightforward and involves disciplinary actions towards members on 
                Horizon who break established rules as outlined in the Wiki pages. Strikes are 
                cumulative for each member, and cover each character the member plays. Staff will 
                keep track of each members' strikes in private. You will always be notified by 
                a Moderator if your actions constitute a strike. If notified, you are expected 
                to correct or modify your actions to avoid further strikes.
              </p>
              
              <p>
                Please note that the staff as a whole have the right to make a determination if 
                your actions constitute as a strike, regardless of whether or not the action 
                itself is included in the list below. Staff will always discuss concerning behavior 
                before proceeding with any disciplinary action.
              </p>

              {/* What counts as a strike? */}
              <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-6">What counts as a strike?</h4>
              
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Breaking any OOC or IC rule found in the Wiki</li>
                <li>Breaking <Link to="/wiki/rules-general" className="font-bold">the Golden Rule</Link> by disrespecting or berating individuals and/or groups in the community—staff and members both included</li>
                <li>Continuing to break OOC or IC rules despite warnings and/or corrections by staff members</li>
              </ul>

              {/* What happens if you get three strikes? */}
              <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-6">What happens if you get three strikes?</h4>
              
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Staff will ultimately make the decision on a case by case basis, but three strikes will typically result in a permanent ban from Horizon for the member and all of his or her characters</li>
              </ul>

              {/* Questions? */}
              <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-6">Questions?</h4>
              
              <p>
                Please PM a staff member for clarification regarding any of the items above.
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

export default ThreeStrikeRule;
