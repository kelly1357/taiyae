import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface BirthdayCharacter {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  monthsAge: number;
  sex: string;
  packName: string | null;
  username: string;
  odUserId: number;
}

type SortField = 'name' | 'username' | 'packName' | 'age';
type SortDirection = 'asc' | 'desc';

const Birthdays: React.FC = () => {
  const [characters, setCharacters] = useState<BirthdayCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchBirthdayCharacters();
  }, []);

  const fetchBirthdayCharacters = async () => {
    try {
      const response = await fetch('/api/birthdays');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch birthday characters', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'age' ? 'desc' : 'asc');
    }
  };

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          break;
        case 'packName':
          aVal = (a.packName || 'Rogue').toLowerCase();
          bVal = (b.packName || 'Rogue').toLowerCase();
          break;
        case 'age':
          aVal = a.monthsAge;
          bVal = b.monthsAge;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [characters, sortField, sortDirection]);

  const formatAge = (months: number): string => {
    const years = Math.floor(months / 12);
    return `Turning ${years} year${years !== 1 ? 's' : ''} old`;
  };

  const handleImageError = (id: number) => {
    setImageErrors(prev => new Set(prev).add(id));
  };

  // Sorting is handled by clicking headers, no visual indicator needed

  if (isLoading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Birthdays</h2>
        </div>
        <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Birthdays</h2>
        <Link to="/activity-tracker" className="text-[#fff9] hover:text-white normal-case text-xs">← Activity Tracker</Link>
      </div>

      <div className="px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🎂</span> Character Birthdays
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          These characters are celebrating a birthday this season! 
          {characters.length > 0 && <span className="font-semibold"> {characters.length} character{characters.length !== 1 ? 's currently have birthdays' : ' currently has a birthday'}.</span>}
        </p>

        {characters.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            No characters are currently celebrating birthdays.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'name' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('name')}
                    >
                      Character
                    </th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'packName' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('packName')}
                    >
                      Pack
                    </th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'age' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('age')}
                    >
                      Age
                    </th>
                    <th 
                      className={`px-4 py-2 text-left cursor-pointer hover:bg-gray-300 select-none ${sortField === 'username' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('username')}
                    >
                      Player
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCharacters.map((char) => (
                    <tr key={char.id} className="hover:bg-gray-50 transition-colors align-top border-t border-gray-300">
                      <td className="p-0 w-[25%] border-r border-gray-300 relative">
                        <Link to={`/character/${char.slug || char.id}`} className="block">
                          {char.imageUrl && !imageErrors.has(char.id) ? (
                            <img 
                              src={char.imageUrl} 
                              alt={char.name}
                              className="w-full object-cover block"
                              style={{ aspectRatio: '16/9' }}
                              onError={() => handleImageError(char.id)}
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
                          {char.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-gray-700">
                        {char.packName || <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-gray-700">
                        {formatAge(char.monthsAge)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <Link to={`/user/${char.odUserId}`} className="text-[#5c7c3b] hover:text-[#4a6530]">
                          {char.username}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {sortedCharacters.map((char) => (
                <div key={char.id} className="border border-gray-300 bg-white overflow-hidden">
                  <div className="relative">
                    <Link to={`/character/${char.slug || char.id}`} className="block">
                      {char.imageUrl && !imageErrors.has(char.id) ? (
                        <img 
                          src={char.imageUrl} 
                          alt={char.name}
                          className="w-full object-cover"
                          style={{ aspectRatio: '16/9' }}
                          onError={() => handleImageError(char.id)}
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
                    <Link to={`/character/${char.slug || char.id}`} className="absolute top-0 left-0 text-white px-2 py-1 text-sm font-bold capitalize hover:underline" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)' }}>
                      {char.name}
                    </Link>
                  </div>
                  <div className="p-3 text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">Age:</span> {formatAge(char.monthsAge)}</div>
                    <div><span className="font-medium">Pack:</span> {char.packName || <span className="uppercase tracking-wide text-gray-500" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>}</div>
                    <div><span className="font-medium">Player:</span>{' '}
                      <Link to={`/user/${char.odUserId}`} className="text-[#5c7c3b] hover:text-[#4a6530]">
                        {char.username}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Birthdays;
