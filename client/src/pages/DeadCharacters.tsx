import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Character } from '../types';

type SortField = 'name' | 'username' | 'packName' | 'age' | 'deathDate' | 'sex';
type SortDirection = 'asc' | 'desc';

const DeadCharacters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('deathDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        // Filter to only dead characters
        const deadChars = data.filter((c: Character) => c.status === 'Dead');
        setCharacters(deadChars);
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
      setSortDirection(field === 'deathDate' ? 'desc' : 'asc');
    }
  };

  const sortedCharacters = useMemo(() => {
    let filtered = [...characters];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().startsWith(query) ||
        (c.username || '').toLowerCase().startsWith(query) ||
        (c.packName || '').toLowerCase().startsWith(query)
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
        case 'sex':
          aVal = (a.sex || '').toLowerCase();
          bVal = (b.sex || '').toLowerCase();
          break;
        case 'packName':
          aVal = (a.packName || 'Rogue').toLowerCase();
          bVal = (b.packName || 'Rogue').toLowerCase();
          break;
        case 'age':
          aVal = a.monthsAge || 0;
          bVal = b.monthsAge || 0;
          break;
        case 'deathDate':
          // Sort by Horizon date string (e.g., "HY0, Early Summer")
          aVal = a.deathDate || '';
          bVal = b.deathDate || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [characters, sortField, sortDirection, searchQuery]);

  const formatDeathDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Unknown';
    // Death date is now a Horizon date string (e.g., "HY0, Early Summer")
    return dateStr;
  };

  if (isLoading) {
    return <div className="text-center mt-10 text-white">Loading characters...</div>;
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
        Dead Characters
      </div>
      <div className="px-4 py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Dead</h3>
        <p className="text-sm text-gray-600 mb-3">
          {characters.length === 0 
            ? 'No wolves have died yet.' 
            : <><span className="font-bold">{characters.length}</span> dead {characters.length === 1 ? 'wolf' : 'wolves'}:</>
          }
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          <Link to="/characters" className="text-blue-600 hover:underline">← Back to Character List</Link>
        </p>
        
        {characters.length > 0 && (
          <>
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
                    <th 
                      className={`px-3 py-2 text-left w-[25%] border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'name' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('name')}
                    >
                      Character
                    </th>
                    <th 
                      className={`px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'sex' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('sex')}
                    >
                      Sex
                    </th>
                    <th 
                      className={`px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'age' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('age')}
                    >
                      Age
                    </th>
                    <th 
                      className={`px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'packName' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('packName')}
                    >
                      Pack
                    </th>
                    <th 
                      className={`px-3 py-2 text-center border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'deathDate' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('deathDate')}
                    >
                      Died
                    </th>
                    <th 
                      className={`px-3 py-2 text-left cursor-pointer hover:bg-gray-300 select-none ${sortField === 'username' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('username')}
                    >
                      Player
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCharacters.map(char => (
                    <tr key={char.id} className="hover:bg-gray-50 transition-colors align-top border-t border-gray-300">
                      <td className="p-0 w-[25%] border-r border-gray-300 relative">
                        <Link to={`/character/${char.slug || char.id}`} className="block">
                          {char.imageUrl && char.imageUrl.trim() !== '' && !imageErrors.has(char.id) ? (
                            <img 
                              src={char.imageUrl} 
                              alt={char.name} 
                              className="w-full object-cover block grayscale"
                              style={{ aspectRatio: '16/9' }}
                              onError={() => setImageErrors(prev => new Set(prev).add(char.id))}
                            />
                          ) : (
                            <div 
                              className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                              style={{ aspectRatio: '16/9' }}
                            >
                              <img 
                                src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                                alt="Placeholder" 
                                className="w-12 h-12 opacity-40"
                              />
                            </div>
                          )}
                        </Link>
                        <Link to={`/character/${char.slug || char.id}`} className="absolute top-0 left-0 text-white px-2 py-1 text-xs font-bold capitalize hover:underline" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)' }}>
                          {char.name}{char.surname ? ` ${char.surname}` : ''}
                        </Link>
                      </td>
                      <td className={`px-3 py-3 border-r border-gray-300 ${char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>{char.sex || 'Unknown'}</td>
                      <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.age}</td>
                      <td className="px-3 py-3 text-gray-700 border-r border-gray-300">
                        {char.packName ? char.packName : (
                          <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700 border-r border-gray-300">{formatDeathDate(char.deathDate)}</td>
                      <td className="px-3 py-3 text-gray-700">{char.username || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default DeadCharacters;
