import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ForumRegion } from '../types';

const Home: React.FC = () => {
  const [regions, setRegions] = useState<ForumRegion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/region')
      .then(res => res.json())
      .then(data => {
        setRegions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch regions:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center p-8">Loading regions...</div>;

  return (
    <div className="relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('https://taiyaefiles.blob.core.windows.net/web/home.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gray-900/50" />
      </div>

      <div className="space-y-8 relative z-10">
        <section className="bg-gray-700/90 p-6 rounded-lg shadow-lg backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">Game Updates</h2>
          <div className="space-y-4">
            <div className="bg-gray-800/80 p-4 rounded">
              <h3 className="font-bold text-yellow-500">Sitewide Updates</h3>
              <p className="text-sm text-gray-300 mt-1">Welcome to the new Horizon! We have migrated to a new system.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-center uppercase tracking-widest text-white drop-shadow-md">Roleplay Forums</h2>
          <div className="grid gap-6">
            {regions.map((region) => (
              <div key={region.id} className="bg-gray-700/90 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row backdrop-blur-sm">
                {region.imageUrl && (
                  <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative group">
                    <img 
                      src={region.imageUrl} 
                      alt={region.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                )}
                <div className="p-6 flex-grow">
                <Link to={`/region/${region.id}`} className="text-xl font-bold text-blue-300 hover:text-blue-200 mb-2 block">
                  {region.name}
                </Link>
                <p className="text-gray-300 mb-4">{region.description}</p>
                {region.subareas.length > 0 && (
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold">Subareas: </span>
                    {region.subareas.map((sub, index) => (
                      <span key={sub.id}>
                        <Link to={`/region/${region.id}/subarea/${sub.id}`} className="hover:text-white">
                          {sub.name}
                        </Link>
                        {index < region.subareas.length - 1 && ' · '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-800 p-4 w-full md:w-64 flex flex-col justify-center border-l border-gray-600">
                <div className="text-center text-sm text-gray-400">
                  <p>Active Threads: 12</p>
                  <p>Total Posts: 1,234</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
};

export default Home;
