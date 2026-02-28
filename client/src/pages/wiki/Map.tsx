import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext } from 'react-router-dom';
import WikiInlineEditor from '../../components/WikiInlineEditor';
import WikiSearchBox from '../../components/WikiSearchBox';
import MapGrid from '../../components/MapGrid';
import type { WikiInlineEditorRef } from '../../components/WikiInlineEditor';
import type { User } from '../../types';

const Map: React.FC = () => {
  const { user } = useOutletContext<{ user?: User }>();
  const isModerator = user?.isModerator || user?.isAdmin;
  const editorRef = useRef<WikiInlineEditorRef>(null);
  const [showMapModal, setShowMapModal] = useState(false);

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
          <span>Map</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Map</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Horizon Map — outside WikiInlineEditor so it always renders */}
            <div className="text-xs text-gray-800 mb-6">
              <p className="mb-4">The map represents the relative location of each territory. Use the grid overlay to reference specific locations.</p>
              
              <MapGrid onOpenFullSize={() => setShowMapModal(true)} />
              
              <p className="mt-4 italic text-gray-500">Gigantic thank-you to Lea for making this map!</p>
            </div>

            {/* Wiki-editable content below the map */}
            <WikiInlineEditor
              ref={editorRef}
              slug="map"
              title="Map"
              userId={user?.id}
              isModerator={isModerator}
            >
            {/* Travelling */}
            <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Travelling</h3>
            
            <div className="text-xs text-gray-800">
              <p>Please keep the following in mind when describing your character's travels: It takes a wolf at least half a day to travel from one area to the next. As such, travel across the entire valley can take a wolf several days. It is an arduous journey if taken too quickly without rest.</p>
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

      {/* Map Modal — portaled to body to escape z-10 stacking context */}
      {showMapModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowMapModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMapModal(false); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center text-lg z-10"
            >
              ✕
            </button>
            <img 
              src="https://taiyaefiles.blob.core.windows.net/web/map.jpg" 
              alt="Horizon Valley Map" 
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Map;
