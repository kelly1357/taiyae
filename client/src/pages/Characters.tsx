import React, { useState, useEffect } from 'react';
import type { Character } from '../types';

const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch characters', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-10 text-white">Loading characters...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Character Directory</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Avatar</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Pack</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Height</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Build</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Health</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Skill Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {characters.map(char => (
              <tr key={char.id} className="hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={char.imageUrl} 
                    alt={char.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  <div className="flex items-center gap-2">
                    {char.name}
                    {!!char.isOnline && (
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full border border-gray-800 shadow-sm" title="Online Now"></span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{char.packName || 'Loner'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{char.age}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{char.height || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{char.build || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{char.healthStatus || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="border border-gray-600 rounded overflow-hidden text-xs text-center w-64 mx-auto">
                    <div className="grid grid-cols-4 bg-gray-700 text-gray-300 font-semibold">
                      <div className="p-1 border-r border-gray-600">Exp</div>
                      <div className="p-1 border-r border-gray-600">Phys</div>
                      <div className="p-1 border-r border-gray-600">Know</div>
                      <div className="p-1">Total</div>
                    </div>
                    <div className="grid grid-cols-4 bg-gray-800 text-white">
                      <div className="p-1 border-r border-gray-600">{char.experience || 0}</div>
                      <div className="p-1 border-r border-gray-600">{char.physical || 0}</div>
                      <div className="p-1 border-r border-gray-600">{char.knowledge || 0}</div>
                      <div className="p-1 font-bold text-blue-400">{char.totalSkill || 0}</div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Characters;
