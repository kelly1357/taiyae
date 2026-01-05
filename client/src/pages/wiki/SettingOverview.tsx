import React from 'react';
import { Link } from 'react-router-dom';

const SettingOverview: React.FC = () => {
  const seasons = [
    { name: 'Full Winter', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Winter.jpg' },
    { name: 'Late Winter', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Winter.jpg' },
    { name: 'Early Spring', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Spring.jpg' },
    { name: 'Full Spring', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Spring.jpg' },
    { name: 'Late Spring', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Spring.jpg' },
    { name: 'Early Summer', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Summer.jpg' },
    { name: 'Full Summer', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Summer.jpg' },
    { name: 'Late Summer', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Summer.jpg' },
    { name: 'Early Autumn', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Autumn.jpg' },
    { name: 'Full Autumn', image: 'https://taiyaefiles.blob.core.windows.net/web/Full%20Autumn.jpg' },
    { name: 'Late Autumn', image: 'https://taiyaefiles.blob.core.windows.net/web/Late%20Autumn.jpg' },
    { name: 'Early Winter', image: 'https://taiyaefiles.blob.core.windows.net/web/Early%20Winter.jpg' },
  ];

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
      </div>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/wiki/handbook" className="hover:underline">Wiki</Link>
          <span className="mx-2">›</span>
          <span>Setting Overview</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Setting Overview</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-none text-gray-800 text-xs">
              {/* Introduction */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
                Introduction
              </h3>
              
              <p className="mb-4">
                The Horizon Valley is a vast expanse with varied terrain— a gigantic, uncharted, 
                and beautiful place untouched by man.
              </p>
              
              <p className="mb-4">
                Hidden between the unforgiving desert on its eastern boundary to the pristine 
                shoreline to its western edge, there are gigantic lakes, dark, tangled forests, 
                and a world of other areas waiting to be explored. There is a wealth of profound 
                beauty to be discovered by the wolves who have come to Horizon— but of course, 
                there is also danger.
              </p>
              
              <p className="mb-4">
                It is to be assumed that new characters entering Horizon have no prior 
                experiences or pre-existing awareness of the Valley and cannot be born within the valley 
                (unless done ICly).
              </p>

              {/* Location */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Location
              </h3>
              
              <div className="mb-4">
                <img 
                  src="https://taiyaefiles.blob.core.windows.net/web/map-world.png" 
                  alt="World Map showing Horizon Valley location" 
                  className="float-right ml-4 mb-2 w-48"
                />
                <p className="mb-4">
                  The Horizon Valley (or "the Valley") is located in the Pacific Northwest region 
                  of the United States, probably somewhere close to the US/Canada border. Its 
                  exact latitude and longitude are unknown.
                </p>
                
                <p className="mb-4">
                  Due to its location in the Pacific Northwest, the Horizon Valley's terrain and 
                  geography varies greatly from area to area. Its biomes include deserts, 
                  mountains, grasslands, deciduous and boreal forests, and coastlines. The western edge of 
                  the Valley aligns with the west coast of North America.
                </p>
              </div>
              
              <div className="clear-both"></div>

              {/* Time Period */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Time Period
              </h3>
              
              <p className="mb-4">
                The current year is HY4 (Horizon Year Four). In human years, it is set in the early 1900s. Many endangered or extinct 
                species of wolves and other wildlife still live freely in the wild, and much of the 
                Pacific Northwest region is largely unexplored by humans.
              </p>

              {/* Wolves and Humans */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Wolves and Humans
              </h3>
              
              <p className="mb-4">
                The Horizon Valley itself is untouched by man, but wolves from outside the 
                Valley may have faced either indigenous peoples or early Western pioneers. While 
                wolves may have encountered dogs or wolf-dog hybrids in their lifetimes, only 
                full-blooded wolves are permitted as playable characters in Horizon. Any history with 
                humans should be encounter-based only. Extensive histories involving humans are 
                strictly prohibited.
              </p>
              
              <p className="mb-4 text-xs italic">
                *This does not mean your characters are required to talk like old prospectors, 
                but wolves who have encountered humans should not also have encountered cars, 
                planes, and other results of the American industrial revolution.
              </p>

              {/* Seasons, Climate, and Weather */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Seasons, Climate, and Weather
              </h3>
              
              <p className="mb-4">
                Horizon experiences four seasons (Summer, Spring, Winter and Autumn)— in the 
                game, these are divided into three subseasons each (e.g. Early Summer, Full Summer, 
                and Late Summer).
              </p>

              {/* Season Images Grid */}
              <div className="grid grid-cols-12 gap-1 my-6">
                {seasons.map((season) => (
                  <div key={season.name} className="text-center">
                    <img 
                      src={season.image} 
                      alt={season.name} 
                      className="w-full h-auto mb-1"
                    />
                    <p className="text-[10px] leading-tight">{season.name}</p>
                  </div>
                ))}
              </div>

              <p className="mb-4">
                The geography and climate of Horizon's territories vary from area to area during 
                each season. Most of the Horizon Valley endures a rainy season during the 
                warmer months of the year. Alpine climates like those in the Skyrise Mountain Range 
                are usually snowy year-round.
              </p>

              {/* Timeline */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Timeline
              </h3>
              
              <p className="mb-4">
                Horizon runs on a slightly accelerated timeline. Each IC month or sub-season 
                (like "Early Autumn" for example) lasts four weeks, or 28 days.
              </p>
              
              <p className="mb-4">
                In the case that a thread lasts beyond one full season (e.g. a thread started in 
                Full Winter isn't finished by the time Full Spring starts), try to finish it 
                up, or it will soon become a dead thread.
              </p>

              {/* Traveling */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Traveling
              </h3>
              
              <p className="mb-4">
                Travel from one area to the next takes a wolf one half day at an average pace 
                (trot), not counting stops for rest or food. Travel across the entire valley can 
                take a wolf several days at least, and can be an arduous journey if taken without 
                rest.
              </p>
              
              <p className="mb-4">
                That said, a wolf can run for long distances, and can cover the distance between 
                two territories within a few hours under unusual or urgent circumstances.
              </p>

              {/* Discovering Territories */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Discovering Territories
              </h3>
              
              <div className="mb-4">
                <div className="float-right ml-4 mb-2 w-48 text-center">
                  <Link to="/wiki/map">
                    <img 
                      src="https://taiyaefiles.blob.core.windows.net/web/map.jpg" 
                      alt="Horizon Valley Map" 
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </Link>
                  <p className="text-xs mt-1">
                    <Link to="/wiki/map" className="text-[#2f3a2f] hover:underline">View full-size map</Link>
                  </p>
                </div>
                <p className="mb-4">
                  Every once in a while, a wolf may stumble upon a new area IC. If the area is 
                  described well enough in posts, makes enough geographic sense to exist where it 
                  does, and is memorable enough, it can become a playable territory.
                </p>
              </div>
              
              <div className="clear-both"></div>

              {/* Flora & Fauna */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                Flora & Fauna
              </h3>
              
              <p className="mb-4">
                Plants and wildlife in Horizon vary by area. See the <strong>Animal Guide</strong> for a comprehensive overview of the animals in Horizon.
              </p>

              {/* What is Taiyae */}
              <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 mt-8">
                What is Taiyae, and What Happened to It?
              </h3>
              
              <p className="mb-4">
                Taiyae is another fictional valley somewhere to the East of Horizon. Some of the 
                wolves in Horizon came there after their homes in Taiyae were destroyed by 
                humans.
              </p>
              
              <p className="mb-4">
                (Taiyae was a RP site that existed a few years ago, and was the predecessor to 
                Horizon— but Horizon is its own story and is an entirely different site 
                altogether, even though some Taiyae characters are still around.)
              </p>

              {/* Navigation */}
              <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between text-xs">
                <div>
                  <span className="text-gray-500">Joining Guide:</span><br />
                  <Link to="/wiki/rules-general" className="text-[#2f3a2f] hover:underline">
                    ← Back: Site Rules
                  </Link>
                </div>
                <div className="text-right">
                  <br />
                  <Link to="/wiki/wolf-guide" className="text-[#2f3a2f] hover:underline">
                    Next: Wolf Guide →
                  </Link>
                </div>
              </div>

              {/* Categories */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <h4 className="text-xs font-normal uppercase tracking-wider text-gray-500 mb-2">Categories:</h4>
                <p className="text-xs">
                  • <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">Handbook</Link>
                </p>
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

export default SettingOverview;
