import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface InactiveCharacter {
  CharacterID: number;
  Name: string;
  Username: string;
  LastICPostAt: string | null;
  JoinedAt: string;
}

type SortField = 'CharacterID' | 'Name' | 'Username' | 'LastICPostAt' | 'JoinedAt';
type SortDirection = 'asc' | 'desc';

const ActivityTracker: React.FC = () => {
  const [characters, setCharacters] = useState<InactiveCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCheckDate, setNextCheckDate] = useState<string>('');
  const [postCutoffDate, setPostCutoffDate] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('Name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchInactiveCharacters();
    calculateNextCheckDate();
  }, []);

  const fetchInactiveCharacters = async () => {
    try {
      const response = await fetch('/api/activity-tracker');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextCheckDate = () => {
    // Activity checks happen on the last day of each month
    const now = new Date();
    let nextCheck: Date;
    
    // Get the last day of the current month
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // If we're past the last day of the month, get the last day of next month
    if (now > lastDayOfCurrentMonth) {
      nextCheck = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    } else {
      nextCheck = lastDayOfCurrentMonth;
    }
    
    // Post cutoff is 7 days before the check
    const cutoff = new Date(nextCheck);
    cutoff.setDate(cutoff.getDate() - 7);
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'numeric', day: 'numeric', year: 'numeric' };
    setNextCheckDate(nextCheck.toLocaleDateString('en-US', options));
    setPostCutoffDate(cutoff.toLocaleDateString('en-US', options));
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
    return [...characters].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'CharacterID':
          aVal = a.CharacterID;
          bVal = b.CharacterID;
          break;
        case 'Name':
          aVal = a.Name.toLowerCase();
          bVal = b.Name.toLowerCase();
          break;
        case 'Username':
          aVal = a.Username.toLowerCase();
          bVal = b.Username.toLowerCase();
          break;
        case 'LastICPostAt':
          aVal = a.LastICPostAt ? new Date(a.LastICPostAt).getTime() : 0;
          bVal = b.LastICPostAt ? new Date(b.LastICPostAt).getTime() : 0;
          break;
        case 'JoinedAt':
          aVal = new Date(a.JoinedAt).getTime();
          bVal = new Date(b.JoinedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [characters, sortField, sortDirection]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Activity Checks</h2>
      </div>

      <div className="px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Activity Tracker</h1>

        {/* How It Works Section */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          How It Works!
        </h2>
        
        <div className="text-sm text-gray-800 space-y-3 mb-6">
          <p>
            • All characters who haven't posted since the last check are automatically shown in this list. 
            Note that directly after a check, all characters will start out on the list!
          </p>
          <p>
            • To get your character's name off the list, just make an IC post before the next check.
          </p>
          <p>
            • Characters left on the list by the next check date will become Inactive.
          </p>
        </div>

        <div className="bg-gray-100 border border-gray-300 px-4 py-3 mb-6 text-sm text-gray-700">
          The next check is scheduled for <strong>{nextCheckDate}</strong>, and the post cutoff will be <strong>{postCutoffDate}</strong>.
        </div>

        {/* The List Section */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          The List
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          If you see your character's name on this list, don't worry! You just need to make one IC post 
          with your character before the next check, and your character's name will disappear from the list:
        </p>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : characters.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            No characters currently on the activity list. Great job everyone!
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'CharacterID' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('CharacterID')}
                    >
                      ID
                    </th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'Name' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('Name')}
                    >
                      Username
                    </th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'Username' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('Username')}
                    >
                      Player
                    </th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'LastICPostAt' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('LastICPostAt')}
                    >
                      Last IC Post
                    </th>
                    <th 
                      className={`px-4 py-2 text-left cursor-pointer hover:bg-gray-300 select-none ${sortField === 'JoinedAt' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleSort('JoinedAt')}
                    >
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCharacters.map((char) => (
                    <tr key={char.CharacterID} className="border-t border-gray-300">
                      <td className="px-4 py-2 text-gray-600 border-r border-gray-300">{char.CharacterID}</td>
                      <td className="px-4 py-2 border-r border-gray-300">
                        <Link to={`/character/${char.CharacterID}`} className="text-gray-900 hover:underline font-semibold">
                          {char.Name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-700 border-r border-gray-300">{char.Username}</td>
                      <td className="px-4 py-2 text-gray-700 border-r border-gray-300">
                        {formatDate(char.LastICPostAt)}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{formatDate(char.JoinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden border border-gray-300">
              {/* Mobile Sort Options */}
              <div className="bg-gray-200 px-3 py-2 flex items-center gap-2 text-xs border-b border-gray-300">
                <span className="text-gray-600">Sort by:</span>
                <select 
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                >
                  <option value="Name">Name</option>
                  <option value="Username">Player</option>
                  <option value="LastICPostAt">Last IC Post</option>
                  <option value="JoinedAt">Joined</option>
                </select>
                <button 
                  onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                  className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                >
                  {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
              
              <div className="divide-y divide-gray-300">
                {sortedCharacters.map((char) => (
                  <div key={char.CharacterID} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <Link to={`/character/${char.CharacterID}`} className="text-gray-900 hover:underline font-semibold">
                        {char.Name}
                      </Link>
                      <span className="text-xs text-gray-400">#{char.CharacterID}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                      <div>Player: <span className="text-gray-700">{char.Username}</span></div>
                      <div className="flex gap-4">
                        <span>Last IC: <span className="text-gray-700">{formatDate(char.LastICPostAt)}</span></span>
                        <span>Joined: <span className="text-gray-700">{formatDate(char.JoinedAt)}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ActivityTracker;
