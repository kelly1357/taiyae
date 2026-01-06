import React, { useState, useEffect, useMemo } from 'react';
import type { Character } from '../types';

type SortField = 'name' | 'username' | 'packName' | 'age' | 'healthStatus' | 'totalSkill';
type SortDirection = 'asc' | 'desc';

const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCharacters = useMemo(() => {
    let filtered = [...characters];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        (c.username || '').toLowerCase().includes(query) ||
        (c.packName || '').toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'username':
          aVal = (a.username || '').toLowerCase();
          bVal = (b.username || '').toLowerCase();
          break;
        case 'packName':
          aVal = (a.packName || 'Rogue').toLowerCase();
          bVal = (b.packName || 'Rogue').toLowerCase();
          break;
        case 'age':
          aVal = a.monthsAge || 0;
          bVal = b.monthsAge || 0;
          break;
        case 'healthStatus':
          aVal = (a.healthStatus || '').toLowerCase();
          bVal = (b.healthStatus || '').toLowerCase();
          break;
        case 'totalSkill':
          aVal = a.totalSkill || 0;
          bVal = b.totalSkill || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [characters, sortField, sortDirection, searchQuery]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="ml-1 w-3 h-3 inline text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="ml-1 w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return <div className="text-center mt-10 text-white">Loading characters...</div>;
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
        Character Directory
      </div>
      <div className="px-4 py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Active Characters</h3>
        <p className="text-sm text-gray-600 mb-3">There are currently {characters.length} wolves in Horizon:</p>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search characters, players, or packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="border border-gray-300 mx-0.5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                <th className="px-3 py-2 text-left w-[25%] border-r border-gray-300">
                  <span 
                    className="cursor-pointer hover:text-gray-900 select-none"
                    onClick={() => handleSort('name')}
                  >
                    Character<SortIcon field="name" />
                  </span>
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('name')}
                >
                  Sex
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('age')}
                >
                  Age<SortIcon field="age" />
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('packName')}
                >
                  Pack<SortIcon field="packName" />
                </th>
                <th 
                  className="px-3 py-2 text-center border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('totalSkill')}
                >
                  Skill Points<SortIcon field="totalSkill" />
                </th>
                <th 
                  className="px-3 py-2 text-left cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('username')}
                >
                  Player<SortIcon field="username" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCharacters.map(char => (
                <tr key={char.id} className="hover:bg-gray-50 transition-colors align-top border-t border-gray-300">
                  <td className="p-0 w-[25%] border-r border-gray-300 relative">
                    <img 
                      src={char.imageUrl} 
                      alt={char.name} 
                      className="w-full object-cover block"
                      style={{ aspectRatio: '16/9' }}
                    />
                    <span className="absolute top-0 left-0 text-white px-2 py-1 text-sm font-bold uppercase" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)' }}>
                      {char.name}
                      {!!char.isOnline && (
                        <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block border border-white" title="Online Now"></span>
                      )}
                    </span>
                  </td>
                  <td className={`px-3 py-3 border-r border-gray-300 ${char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>{char.sex || 'Unknown'}</td>
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.age}</td>
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-300">
                    {char.packName ? char.packName : (
                      <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900 border-r border-gray-300">{char.totalSkill || 0}</td>
                  <td className="px-3 py-3 text-gray-700">{char.username || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Characters;
