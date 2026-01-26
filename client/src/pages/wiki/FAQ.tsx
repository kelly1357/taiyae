import React, { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const FAQ: React.FC = () => {
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
          <span>FAQ</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">FAQ</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="faq"
              title="FAQ"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="max-w-none text-gray-800">
              {/* Table of Contents */}
              <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                Table of Contents
              </h2>
              <ul className="text-xs mb-6 list-disc list-inside space-y-1">
                <li><a href="#what-is-this" className="text-[#2f3a2f] hover:underline">Wait, what is this?</a></li>
                <li><a href="#roleplaying-level" className="text-[#2f3a2f] hover:underline">What roleplaying level is this site?</a></li>
                <li><a href="#what-can-do" className="text-[#2f3a2f] hover:underline">What can my character do?</a></li>
                <li><a href="#what-cant-do" className="text-[#2f3a2f] hover:underline">What can't my character do?</a></li>
                <li><a href="#packs" className="text-[#2f3a2f] hover:underline">Are there any packs, and how do packs get created?</a></li>
                <li><a href="#time-commitment" className="text-[#2f3a2f] hover:underline">How big of a time commitment is this site?</a></li>
                <li><a href="#rewards" className="text-[#2f3a2f] hover:underline">Are there any IC reward systems (like trophies)?</a></li>
                <li><a href="#how-long" className="text-[#2f3a2f] hover:underline">How long has this site been around?</a></li>
                <li><a href="#in-charge" className="text-[#2f3a2f] hover:underline">Who's in charge around here?</a></li>
                <li><a href="#no-tables" className="text-[#2f3a2f] hover:underline">Why don't you allow posting tables or signatures?</a></li>
                <li><a href="#joined-now-what" className="text-[#2f3a2f] hover:underline">I joined. Now what?</a></li>
              </ul>

              {/* Wait, what is this? */}
              <h3 id="what-is-this" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">Wait, what is this?</h3>
              <p className="text-xs mb-6">
                Horizon is a play-by-post forum RPG. Its genre is realistic wolf. If you're new to forum RPGs, check out{' '}
                <a href="http://forumroleplay.com/roleplay-guides/forum-roleplaying-basics/" target="_blank" rel="noopener noreferrer" className="text-[#2f3a2f] hover:underline">
                  forumroleplay.com
                </a>{' '}
                for an explanation of the basics. For more information on who we are, check out the{' '}
                <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">Game Overview</Link>!
              </p>

              {/* What roleplaying level is this site? */}
              <h3 id="roleplaying-level" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">What roleplaying level is this site?</h3>
              <p className="text-xs mb-4">
                We don't officially have a level— lots of our roleplaying could be considered "advanced," but we know there are 
                many definitions of this term. We expect all members to write with proper grammar and spelling, and we emphasize 
                speed over quality over quantity. We have no minimum word count.
              </p>
              <p className="text-xs mb-4">
                If you're not quite sure and want to check out some writing, take a look at our Recent Posts, or just browse 
                around in the forums.
              </p>
              <p className="text-xs mb-6">
                If it doesn't seem like you'll be able to write at at least the same level as the general community, your 
                application may be declined, or if accepted, you may be asked to put more effort into your posts. Please don't 
                be offended if this happens to you; it's simply the way of the game!
              </p>

              {/* What can my character do? */}
              <h3 id="what-can-do" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">What can my character do?</h3>
              <p className="text-xs mb-4">
                Anything within the physical bounds of what a real wolf could do (plus talk). Since our style is freeform, 
                there's no predefined plot. There may sometimes be overarcing random events, but usually, all plots will be 
                character (and thus player) driven.
              </p>
              <p className="text-xs mb-6">
                Plot-wise, there are no OOC-specified limitations as to what your character can do. Want to traipse around an 
                enemy pack's territory? Go for it— your character might face some resistance from other wolves, but OOC, 
                nobody's going to stop you.
              </p>

              {/* What can't my character do? */}
              <h3 id="what-cant-do" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">What can't my character do?</h3>
              <p className="text-xs mb-6">
                Most things that a fantasy wolf RPG might include are not really relevant in Horizon. Your wolf can't sprout 
                wings and fly around, nor can he carry around human items like bags or bottles of potions. He shouldn't have 
                any jewelry or clothing, nor should he have any superpowers.
              </p>

              {/* Are there any packs? */}
              <h3 id="packs" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">Are there any packs, and how do packs get created?</h3>
              <p className="text-xs mb-6">
                Packs are created totally IC— there are some OOC requirements to creating packs to keep things fair, but the 
                process occurs IC, and can happen at any time. This means your character could feasibly create a pack today, 
                provided he meets the requirements. Check out the{' '}
                <Link to="/wiki/pack-creation" className="text-[#2f3a2f] hover:underline">Pack Creation</Link>{' '}
                Handbook page for more info.
              </p>

              {/* How big of a time commitment? */}
              <h3 id="time-commitment" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">How big of a time commitment is this site?</h3>
              <p className="text-xs mb-6">
                As big or small as you want it to be. We anticipate that you'll spend a lot of time here because, well, it's 
                fun! But if you can only post once or twice a week, that's fine, too. That said, you'll get out what you put 
                in; the more active you are, the more adventures your character will get into.
              </p>

              {/* Are there any IC reward systems? */}
              <h3 id="rewards" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">Are there any IC reward systems (like trophies)?</h3>
              <p className="text-xs mb-6">
                We are working on integrating both an IC (Emblems) system, as well as contests and other fun stuff. We 
                currently have the{' '}
                <Link to="/wiki/achievements" className="text-[#2f3a2f] hover:underline">Achievements</Link>{' '}
                feature as a fun way to gain rewards OOC.
              </p>

              {/* How long has this site been around? */}
              <h3 id="how-long" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">How long has this site been around?</h3>
              <p className="text-xs mb-4">
                Horizon itself has been open (read: we started advertising and had most major site functionality ready) on 
                June 8, 2014. Prior to that, we were operating in a slow-moving beta period, while we were still fixing 
                things up and preparing for a larger base of members.
              </p>
              <p className="text-xs mb-4">
                Some of our members were players on a site called Taiyae, which lived on AvidGamers back in the day. Taiyae 
                was a fairly active site, but it inevitably died when its hosting became unreliable.
              </p>
              <p className="text-xs mb-6">
                Is Horizon the new Taiyae? Not really. Horizon operates on the same principles as Taiyae did— we love freeform 
                RP and we strive to keep things simple and fast-paced— but that's where the similarities end. Horizon is its 
                own game with its own story, community, and features. Some characters from Taiyae have migrated to Horizon, 
                but they are few, and in no way does the story revolve around them. (In fact, the story doesn't revolve around 
                any one wolf. Every character is just as important— or unimportant— as the next).
              </p>

              {/* Who's in charge around here? */}
              <h3 id="in-charge" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">Who's in charge around here?</h3>
              <p className="text-xs mb-6">
                Check out the{' '}
                <Link to="/wiki/staff" className="text-[#2f3a2f] hover:underline">Staff</Link>{' '}
                Handbook page for a staff listing. Horizon will likely add more staff in the future as things pick up.
              </p>

              {/* Why don't you allow posting tables or signatures? */}
              <h3 id="no-tables" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">Why don't you allow posting tables or signatures?</h3>
              <p className="text-xs mb-4">
                We want to keep things simple. We want our threads/posts to be easy and continuous to read, like one big 
                story. We love it when the focus is on writing and character development rather than artwork or photos.
              </p>
              <p className="text-xs mb-6">
                That said, we also love artwork and photos, and customization— which is why all members can edit their own 
                profiles (including their profile skins) to their heart's content. For more information on how to edit your 
                profile, check out the{' '}
                <Link to="/wiki/profile-help" className="text-[#2f3a2f] hover:underline">Profile Help</Link>{' '}
                Handbook page.
              </p>

              {/* I joined. Now what? */}
              <h3 id="joined-now-what" className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 scroll-mt-4">I joined. Now what?</h3>
              <p className="text-xs mb-6">
                Time to dive in! Go ahead and make your first post if you feel like it, or check out our{' '}
                <Link to="/wiki/getting-started" className="text-[#2f3a2f] hover:underline">Getting Started</Link>{' '}
                guide (recommended).
              </p>

              <p className="text-xs mb-6 italic">
                Is your question missing from the FAQ? Ask it on the forums!
              </p>
            </div>
            </WikiInlineEditor>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            <WikiSearchBox />

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

export default FAQ;
