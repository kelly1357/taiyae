import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const PackCreation: React.FC = () => {
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
          <span>Pack Creation</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pack Creation</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="pack-creation"
              title="Pack Creation"
              userId={user?.id}
            >
            {/* Overview */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Overview</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <p className="mb-4">In Horizon, packs are built completely In Character. The process of creating a pack occurs in threads, as does the process for joining packs. To ensure that packs are created organically and to keep things fair for all players, all new packs and their founders must meet a list of requirements (see the Requirements section below).</p>

              <h4 className="font-semibold mb-2">Forming Packs</h4>
              <p className="mb-3">Any wolf who wants to start a pack should recruit others to join their pack In Character, preferably over the course of multiple threads. (all recruiting must take place in IC threads— no OOC planning is allowed!). The founding wolf should also scope out subareas they want to claim. In Horizon, packs control one or more subareas, with every pack controlling at least one.</p>
              <p className="mb-3">When the founding wolf/wolves are ready to officially create the pack, the main founder will claim the area during the course of a thread. This thread is the "official" claiming thread.</p>
              <p className="mb-3">The naming convention for packs is "Name Packname," where "Packname" is a descriptor of the type of group it is. Some examples are "Nevermore Syndicate" (Nevermore is the Name, and Syndicate is the Packname), "Ankhame Band," "Pariah Pack," "Fiivar's Mafia," etc. If you can't think of one, "Pack" is acceptable as a Packname.</p>
              <p className="mb-4"><strong>Packs must have a minimum of four (4) members in order to be considered official.</strong></p>

              <h4 className="font-semibold mb-2">Disbanding Packs</h4>
              <p className="mb-3">Packs that fall inactive may be considered disbanded if they do not meet certain requirements. While packs are encouraged to disband IC, inactive players may affect the status of any given pack.</p>
              <p className="mb-3">In order to remain listed on-site, a pack must have at least four members who are:</p>
              <ul className="list-disc list-outside ml-5 mb-3 space-y-1">
                <li>At least eight months old</li>
                <li>Not played by the same player</li>
                <li>Currently active (not marked inactive)</li>
              </ul>
              <p className="mb-3">Packs without four qualifying members will receive a notice. The pack will have a full season (three subseasons) to recruit and pull their numbers up. If the pack fails to do so by the end of the last subseason, they will no longer be listed as an official pack on-site. All OOC listed aspects of the pack (pack page, member ranks, claimed territory notes, etc.) will be removed.</p>
              <p className="mb-3">Wolves may still occupy pack territory and attempt to recruit, and may even still consider themselves a pack.</p>
              <p className="mb-4">Packs can only be added back to the sidebar/other areas of the site by completing and submitting a new pack creation form.</p>

              <h4 className="font-semibold mb-2">Pack Territories</h4>
              <p className="mb-3">A pack's claim to a territory may be challenged by any wolf at any time, so the pack must be able to effectively defend its home in order to lay claim to their territory. If a pack proves unable to defend a subarea long/consistently enough to comfortably reside there, that pack may be forced to disband.</p>
              <p>Since there are no OOC rules preventing any wolf from entering any playable area, wolves may enter other pack's territories as they please. Generally, wandering around an enemy's pack territory is not advisable, but the consequences, if any, will depend on the resident pack.</p>
            </div>

            {/* Claiming and Creating Subareas */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Claiming and Creating Subareas</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Claiming Subareas</h4>
              <p className="mb-3">Packs claim at least one playable subarea for their pack territory. This subarea is a small part of one of the major playable forum areas (like Adder Creek is to Eastern Wasteland). The pack does not have to be named after the area.</p>
              <p className="mb-3">Packs with over 10 wolves (eight months or older) can claim an additional subarea, and can claim a third area at 20 wolves (eight months or older).</p>
              <p className="mb-4">Since the desirability of subareas as pack territories may change depending on the season (for example, one subarea may become basically uninhabitable during Full Winter due to its water source freezing over), packs may move by abandoning their territory and claiming a new one. Packs may claim/abandon subareas at will. If a subarea is abandoned by a pack, it becomes neutral/unclaimed.</p>

              <h4 className="font-semibold mb-2">Creating Subareas</h4>
              <p className="mb-3">Subareas are created over the course of two (2) IC threads in which characters describe the area. The subarea must initially be stumbled on IC before there can be any reference to it in posts.</p>
              <p className="mb-3">Helpful things to describe include the relative location of the area, what makes the subarea unique (landmarks, etc.), what kind of prey the area has available, and interesting facts about the area. Basically, any descriptor that a currently-existing area has should be described over the course of these threads.</p>
              <p className="mb-3">When creating a subarea, simple is better! Subareas are much smaller than main areas and shouldn't contain too many parts or different biomes. When a subarea is submitted for review, staff may request for alteration based on complexity, realism, or other factors. <strong>Note:</strong> For now, there is a pause on creation of any cave-based subareas. If you need assistance coming up with unique ideas for a territory, don't hesitate to reach out to staff!</p>
              <p className="mb-3">Once a subarea has been described enough, it can become a candidate for becoming its own playable subarea in one of two ways:</p>
              <ol className="list-decimal list-outside ml-5 mb-3 space-y-2">
                <li>If a pack does not wish to claim an already existing subarea whilst forming, they may create a subarea as described above. The three descriptive threads may also be the same threads in which the leader and followers interact, per the pack creation requirements below. This method of creating subareas does not apply to already established packs.</li>
                <li>Any wolf (including rogues) can describe a subarea, and if enough other wolves participate in threads in that area, it will become a candidate to be created. Please contact staff if you have an established IC area you'd like to have considered as an official sub-area!</li>
              </ol>
              <p className="mb-3">Due to a recent abundance in new cave-based subareas being discovered, we HIGHLY encourage new discoveries feature biomes and landforms that do not include caves.</p>
              <p><strong>Note:</strong> When submitting an image for a new area, ensure it is at least 1500px wide.</p>
            </div>

            {/* How Does My Wolf Create a Pack? */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">How Does My Wolf Create a Pack?</h3>
            
            <div className="text-xs text-gray-800 mb-6">
              <h4 className="font-semibold mb-2">Requirements</h4>
              <p className="mb-3">Here are the requirements for creating a pack:</p>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>At least three wolves have been recruited In Character (as evidenced by archived threads)</li>
                <li>At least two archived threads contain recruiting or other interaction between the founder and one or more followers, to demonstrate that your pack has been built totally In Character</li>
                <li>At least one archived thread contains In Character development of ranks and titles</li>
                <li>You've completed a thread in which the founding member "officially" claims a subarea for their territory, with the founding wolves present, to mark a total of three threads</li>
                <li>The wolf (or wolves) who will be in the leading rank has at least 800 SP</li>
                <li>The three (or more) wolves who will be supporting members have at least 350 SP each</li>
              </ul>

              <h4 className="font-semibold mb-2">Restrictions</h4>
              <ul className="list-disc list-outside ml-5 mb-4 space-y-2">
                <li>Wolves younger than 8 months don't tally into the required count</li>
                <li>Only one character per user can be a member of the founding pack until it has been fully formed. Members who play offspring or one relative of a founding character are excluded from this; however, the additional character does not go toward the required count</li>
                <li>Members can only have one character who is the leader of any given pack in Horizon</li>
              </ul>
              <p className="mb-4 italic">This rule doesn't apply if we see genuine plot development, as we generally hope is the case!</p>

              <h4 className="font-semibold mb-2">When you've met the requirements</h4>
              <p className="mb-3">As soon as your wolf and his/her pack is eligible to do so, send a PM to one of Horizon's moderators with the information in the following (note: use the <strong>Pack Creation Checklist</strong> to make things easier!):</p>
              <ul className="list-disc list-outside ml-5 space-y-2">
                <li>Pack name</li>
                <li>Two (2) pack colors (main and accent)</li>
                <li>Name of pack founder/leader</li>
                <li>Names of three (3) pack members and their ranks in the new pack</li>
                <li>Links to at least three (3) recruiting threads (the more provided, the better)</li>
                <li>Link to claiming thread</li>
                <li>Pack information:
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                    <li>Rank structure (see the Packs section in the <strong>Wolf Guide</strong> for more info)</li>
                    <li>Short bio/description of the pack, how it got started, its goals/values, etc.</li>
                  </ul>
                </li>
                <li>Pack territory name</li>
                <li>If the territory is a new subarea:
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                    <li>Main area (parent area, e.g. "Eastern Wasteland")</li>
                    <li>Name of the new subarea</li>
                    <li>Short description (try to match those in already existing areas)</li>
                    <li>Links to at least three archived threads where the subarea was described</li>
                    <li>Background photo (strongly preferred!)</li>
                  </ul>
                </li>
              </ul>
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

export default PackCreation;
