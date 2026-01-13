import { useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

export default function WolfGuidePupDevelopment() {
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
          <span>Wolf Guide: Pup Development</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Wolf Guide: Pup Development</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <WikiInlineEditor
              ref={editorRef}
              slug="wolf-guide-pup-development"
              title="Wolf Guide: Pup Development"
              userId={user?.id}
              isModerator={isModerator}
            >
            <div className="max-w-none text-gray-800">

              {/* Newborn */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Newborn</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/newborn.jpg" 
                  alt="Newborn wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Basically a potato. Newborn pups are born blind, deaf, and unable to smell very well.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Can do little more than wriggle, sleep, and nurse, which they do 4-5 times a day. Communicate via small noises (grunts, whimpers).</p>
                <div className="clear-both"></div>
              </div>

              {/* 2 Weeks Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">2 Weeks Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/2weeks.jpg" 
                  alt="2 week old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Eyes open and are blue but eyesight continues to develop. They begin to develop milk teeth and can eat small pieces of regurgitated meat.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Incoherent, repeated syllables of "baby babble" starts, the beginnings of speech (human equivalent 0-1 years of age). Also begin attempting to howl.</p>
                <div className="clear-both"></div>
              </div>

              {/* 3 Weeks Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">3 Weeks Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/3week.jpg" 
                  alt="3 week old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Pups begin to emerge from the den and play near the entrance. Their ears begin to raise and their hearing improves significantly.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Not much change in speech. They also begin to socialize with the rest of the pack.</p>
                <div className="clear-both"></div>
              </div>

              {/* 1 Month Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">1 Month Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/1month.png" 
                  alt="1 month old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Adult fur begins to grow around the nose and the eyes, and the feet and head are disproportionately larger. Playfighting and dominance starts.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Human child equivalent 1-2 years of age. Short syllables begin to evolve into toddler speak, with short sentences being used to communicate wants.</p>
                <div className="clear-both"></div>
              </div>

              {/* 2 Months Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">2 Months Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/2month.jpg" 
                  alt="2 month old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Adults abandon den, pups are moved to a safe hideout site. Eyes transition from blue to their adult colors. Can run and play, but are generally clumsy.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Human child equivalent 2-4 years of age. Possess a small vocabulary learned from their parents, and speak in simple sentences.</p>
                <div className="clear-both"></div>
              </div>

              {/* 3 Months Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">3 Months Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/3month.jpg" 
                  alt="3 month old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Weaning is completed as the pups are moved to a largely meat-based diet provided by the adults. Their coats also develop further.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Human child equivalent 4-6 years of age. Vocabularies increase, but ideas communicated are rudimentary and centered around wants, or simple questions about the world.</p>
                <div className="clear-both"></div>
              </div>

              {/* 4 Months Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">4 Months Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/4month.jpg" 
                  alt="4 month old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Pups may begin to follow adults on hunting trips to observe and learn, and are capable of exploring on their own.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Human child equivalent 6-9 years of age. More complex thoughts and ideas.</p>
                <div className="clear-both"></div>
              </div>

              <hr className="border-gray-300 my-6" />
              <p className="text-xs mb-6 bg-gray-50 p-4 border-l-4 border-gray-300">
                <strong>Note:</strong> At around the end of fourth months, properly nourished pups weigh approximately 40 - 45 lbs (18.1 - 20.4 kg). Weight gain slows to approximately 1.5 lbs (.68 kg) per week.
              </p>

              {/* 5 Months Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">5 Months Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/5month.jpg" 
                  alt="5 month old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Continue accompanying adults on hunts, but are still heavily protected. Begin to grow rapidly as their bodies catch up to their paws and ears.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Human child equivalent 10-12 years of age. May speak almost eloquently, but are still children.</p>
                <div className="clear-both"></div>
              </div>

              {/* 6-7 Months Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">6-7 Months Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/67month.jpg" 
                  alt="6-7 month old wolf pup" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Milk teeth are replaced and pups will have nearly reached their adult height. Pups begin participating in their own smaller hunts themselves.</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Human equivalent of a young teen. May speak eloquently, but are still young.</p>
                <div className="clear-both"></div>
              </div>

              {/* 8 Months-1 Year Old */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">8 Months-1 Year Old</h3>
              <div className="mb-6 overflow-hidden">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/81year.jpg" 
                  alt="8 months to 1 year old wolf" 
                  className="float-left mr-4 mb-2 w-64"
                />
                <p className="text-xs mb-2"><strong>Appearance and milestones:</strong></p>
                <p className="text-xs mb-4">Growth slows significantly; pups begin to fill out more as their bodies catch up to their oversized paws. They are fully capable of long term travel, border patrol, and hunting and find their status in the pack (where applicable).</p>
                <p className="text-xs mb-2"><strong>Behavior and speech:</strong></p>
                <p className="text-xs mb-4">Capable of conversing as adults.</p>
                <div className="clear-both"></div>
              </div>

              {/* 1 Year Old + */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">1 Year Old +</h3>
              <p className="text-xs mb-6">
                After a year, wolves can be physically considered adults and may achieve sexual maturity at any point between 1-3 years, though they may still be maturing mentally for quite a while afterward. They may choose to disperse or they may stay with their birth pack.
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
}
