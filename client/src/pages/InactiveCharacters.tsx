import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types';
import { formatHorizonYear, getHorizonDate } from '../utils/horizonCalendar';

interface InactiveCharacter {
  id: number;
  slug?: string;
  name: string;
  surname?: string;
  imageUrl?: string;
  sex: string;
  age: string;
  monthsAge?: number;
  playerName: string;
  playerId: number;
  packName?: string;
  status: 'Inactive' | 'Dead';
  deathDate?: string;
  lastPostDate?: string;
  totalPosts: number;
  daysSinceLastPost: number;
}

interface InactiveCharactersProps {
  user: User;
}

type SortField = 'name' | 'sex' | 'age' | 'playerName' | 'status' | 'lastPostDate' | 'totalPosts';
type SortDirection = 'asc' | 'desc';

const InactiveCharacters: React.FC<InactiveCharactersProps> = ({ user }) => {
  const [inactiveCharacters, setInactiveCharacters] = useState<InactiveCharacter[]>([]);
  const [charactersToInactivate, setCharactersToInactivate] = useState<InactiveCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inactive' | 'pending'>('inactive');
  const [selectedForInactivation, setSelectedForInactivation] = useState<Set<number>>(new Set());
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeathModal, setShowDeathModal] = useState<InactiveCharacter | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const isModerator = user?.isModerator || user?.isAdmin;

  useEffect(() => {
    if (isModerator) {
      fetchData();
    }
  }, [user.id, isModerator]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const [inactiveRes, pendingRes] = await Promise.all([
        fetch('/api/moderation/inactive-characters', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ userId: user.id })
        }),
        fetch('/api/moderation/characters-to-inactivate', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ userId: user.id })
        })
      ]);

      if (inactiveRes.ok) {
        const data = await inactiveRes.json();
        setInactiveCharacters(data);
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setCharactersToInactivate(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (characterId: number) => {
    setProcessingId(characterId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/moderation/characters/${characterId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, status: 'Active' })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Character reactivated successfully' });
        fetchData();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to reactivate character' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reactivate character' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsDead = async () => {
    if (!showDeathModal) return;
    
    setProcessingId(showDeathModal.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/moderation/characters/${showDeathModal.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          status: 'Dead'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Character marked as dead' });
        setShowDeathModal(null);
        fetchData();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to update character' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update character' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleInactivate = async (characterId: number) => {
    setProcessingId(characterId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/moderation/characters/${characterId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, status: 'Inactive' })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Character marked as inactive' });
        fetchData();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to inactivate character' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to inactivate character' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkInactivate = async () => {
    if (selectedForInactivation.size === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/moderation/characters/bulk-inactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          characterIds: Array.from(selectedForInactivation)
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${selectedForInactivation.size} character(s) marked as inactive` });
        setSelectedForInactivation(new Set());
        fetchData();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to inactivate characters' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to inactivate characters' });
    }
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedForInactivation);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForInactivation(newSet);
  };

  const selectAll = () => {
    if (selectedForInactivation.size === charactersToInactivate.length) {
      setSelectedForInactivation(new Set());
    } else {
      setSelectedForInactivation(new Set(charactersToInactivate.map(c => c.id)));
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

  const sortCharacters = (chars: InactiveCharacter[]) => {
    return [...chars].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = (a.name + (a.surname || '')).toLowerCase();
          bVal = (b.name + (b.surname || '')).toLowerCase();
          break;
        case 'sex':
          aVal = (a.sex || '').toLowerCase();
          bVal = (b.sex || '').toLowerCase();
          break;
        case 'age':
          aVal = a.monthsAge || 0;
          bVal = b.monthsAge || 0;
          break;
        case 'playerName':
          aVal = (a.playerName || '').toLowerCase();
          bVal = (b.playerName || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case 'lastPostDate':
          aVal = a.daysSinceLastPost;
          bVal = b.daysSinceLastPost;
          break;
        case 'totalPosts':
          aVal = a.totalPosts;
          bVal = b.totalPosts;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedInactiveCharacters = useMemo(() => {
    let filtered = inactiveCharacters;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().startsWith(query) ||
        (c.surname || '').toLowerCase().startsWith(query) ||
        (c.playerName || '').toLowerCase().startsWith(query) ||
        (c.packName || '').toLowerCase().startsWith(query)
      );
    }
    return sortCharacters(filtered);
  }, [inactiveCharacters, sortField, sortDirection, searchQuery]);
  
  const sortedCharactersToInactivate = useMemo(() => {
    let filtered = charactersToInactivate;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().startsWith(query) ||
        (c.surname || '').toLowerCase().startsWith(query) ||
        (c.playerName || '').toLowerCase().startsWith(query) ||
        (c.packName || '').toLowerCase().startsWith(query)
      );
    }
    return sortCharacters(filtered);
  }, [charactersToInactivate, sortField, sortDirection, searchQuery]);

  if (!isModerator) {
    return (
      <div className="bg-white border border-gray-300 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only moderators can access this page.</p>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode; className?: string }> = ({ field, children, className = '' }) => (
    <th 
      className={`px-3 py-2 border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === field ? 'bg-gray-300' : ''} ${className}`}
      onClick={() => handleSort(field)}
    >
      {children}
    </th>
  );

  const CharacterRow: React.FC<{ 
    char: InactiveCharacter; 
    showInactivateAction?: boolean;
    showCheckbox?: boolean;
  }> = ({ char, showInactivateAction, showCheckbox }) => (
    <tr className="border-t border-gray-300 hover:bg-gray-50 align-top">
      {showCheckbox && (
        <td className="px-3 py-3 border-r border-gray-300 text-center align-middle">
          <input
            type="checkbox"
            checked={selectedForInactivation.has(char.id)}
            onChange={() => toggleSelection(char.id)}
            className="w-4 h-4"
          />
        </td>
      )}
      <td className="p-0 w-[200px] border-r border-gray-300 relative">
        <Link to={`/character/${char.slug || char.id}`} className="block">
          {char.imageUrl && !char.imageUrl.includes('via.placeholder') ? (
            <img 
              src={char.imageUrl} 
              alt={char.name} 
              className="w-full object-cover block"
              style={{ aspectRatio: '16/9' }}
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
      <td className={`px-3 py-3 border-r border-gray-300 ${char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>
        {char.sex || 'Unknown'}
      </td>
      <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.age}</td>
      <td className="px-3 py-3 border-r border-gray-300 text-gray-600">
        {char.playerName}
      </td>
      <td className="px-3 py-3 border-r border-gray-300 text-center">
        {char.status === 'Dead' ? (
          <span className="px-2 py-1 bg-gray-800 text-white text-xs font-bold">DEAD</span>
        ) : (
          <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-bold">INACTIVE</span>
        )}
      </td>
      <td className="px-3 py-3 border-r border-gray-300 text-gray-600 text-center">
        {formatDate(char.lastPostDate)}
        {char.daysSinceLastPost > 0 && (
          <div className="text-xs text-gray-400">
            ({char.daysSinceLastPost} days ago)
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-center text-gray-600 border-r border-gray-300">
        {char.totalPosts}
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-2 justify-center">
          {showInactivateAction ? (
            <button
              onClick={() => handleInactivate(char.id)}
              disabled={processingId === char.id}
              className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
            >
              {processingId === char.id ? '...' : 'Inactivate'}
            </button>
          ) : (
            <>
              {char.status !== 'Dead' && (
                <button
                  onClick={() => handleReactivate(char.id)}
                  disabled={processingId === char.id}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {processingId === char.id ? '...' : 'Reactivate'}
                </button>
              )}
              {char.status === 'Inactive' && (
                <button
                  onClick={() => setShowDeathModal(char)}
                  disabled={processingId === char.id}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
                >
                  Mark Dead
                </button>
              )}
              {char.status === 'Dead' && (
                <button
                  onClick={() => handleReactivate(char.id)}
                  disabled={processingId === char.id}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {processingId === char.id ? '...' : 'Resurrect'}
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  // Mobile Character Card Component
  const CharacterCard: React.FC<{ 
    char: InactiveCharacter; 
    showInactivateAction?: boolean;
    showCheckbox?: boolean;
  }> = ({ char, showInactivateAction, showCheckbox }) => (
    <div className="p-3 hover:bg-gray-50">
      <div className="flex gap-3">
        {/* Checkbox for pending tab */}
        {showCheckbox && (
          <div className="flex-shrink-0 flex items-start pt-2">
            <input
              type="checkbox"
              checked={selectedForInactivation.has(char.id)}
              onChange={() => toggleSelection(char.id)}
              className="w-4 h-4"
            />
          </div>
        )}
        
        {/* Character Image */}
        <Link to={`/character/${char.slug || char.id}`} className="flex-shrink-0 w-20 relative">
          {char.imageUrl && !char.imageUrl.includes('via.placeholder') ? (
            <img 
              src={char.imageUrl} 
              alt={char.name} 
              className="w-full object-cover rounded"
              style={{ aspectRatio: '1/1' }}
            />
          ) : (
            <div 
              className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded"
              style={{ aspectRatio: '1/1' }}
            >
              <img 
                src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                alt="Placeholder" 
                className="w-8 h-8 opacity-40"
              />
            </div>
          )}
          {/* Status badge on image */}
          <span className={`absolute top-0 right-0 px-1 py-0.5 text-[10px] font-bold ${
            char.status === 'Dead' ? 'bg-gray-800 text-white' : 'bg-yellow-600 text-white'
          }`}>
            {char.status === 'Dead' ? 'DEAD' : 'INACTIVE'}
          </span>
        </Link>

        {/* Character Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/character/${char.slug || char.id}`} className="font-semibold text-gray-900 hover:underline">
            {char.name}{char.surname ? ` ${char.surname}` : ''}
          </Link>
          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-600'}>
                {char.sex === 'Male' ? '♂' : char.sex === 'Female' ? '♀' : '—'} {char.sex || 'Unknown'}
              </span>
              <span className="text-gray-400">·</span>
              <span>{char.age}</span>
            </div>
            <div className="text-gray-600">Player: {char.playerName}</div>
            <div className="flex items-center gap-2 text-gray-500">
              <span>Last post: {formatDate(char.lastPostDate)}</span>
              {char.daysSinceLastPost > 0 && (
                <span className="text-gray-400">({char.daysSinceLastPost}d ago)</span>
              )}
            </div>
            <div className="text-gray-500">{char.totalPosts} posts</div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {showInactivateAction ? (
              <button
                onClick={() => handleInactivate(char.id)}
                disabled={processingId === char.id}
                className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
              >
                {processingId === char.id ? '...' : 'Inactivate'}
              </button>
            ) : (
              <>
                {char.status !== 'Dead' && (
                  <button
                    onClick={() => handleReactivate(char.id)}
                    disabled={processingId === char.id}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {processingId === char.id ? '...' : 'Reactivate'}
                  </button>
                )}
                {char.status === 'Inactive' && (
                  <button
                    onClick={() => setShowDeathModal(char)}
                    disabled={processingId === char.id}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
                  >
                    Mark Dead
                  </button>
                )}
                {char.status === 'Dead' && (
                  <button
                    onClick={() => handleReactivate(char.id)}
                    disabled={processingId === char.id}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {processingId === char.id ? '...' : 'Resurrect'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Character Status Management</h2>
      </div>

      <div className="p-4">
        {message && (
          <div className={`p-3 border text-sm mb-4 ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-300 text-red-800' 
              : 'bg-green-50 border-green-300 text-green-800'
          }`}>
            {message.text}
            <button 
              onClick={() => setMessage(null)} 
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

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

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-300 bg-gray-200 md:w-fit">
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium ${
              activeTab === 'inactive'
                ? 'border-b-2 border-[#2f3a2f] text-[#2f3a2f] bg-white -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Inactive & Dead</span>
            <span className="sm:hidden">Inactive</span>
            {inactiveCharacters.length > 0 && (
              <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                {inactiveCharacters.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium ${
              activeTab === 'pending'
                ? 'border-b-2 border-[#2f3a2f] text-[#2f3a2f] bg-white -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Pending (30+ days)</span>
            <span className="sm:hidden">Pending</span>
            {charactersToInactivate.length > 0 && (
              <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">
                {charactersToInactivate.length}
              </span>
            )}
          </button>
        </div>

        {/* Inactive/Dead Characters Tab */}
        {activeTab === 'inactive' && (
          <div className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : inactiveCharacters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No inactive or dead characters found.
              </div>
            ) : (
              <div className="border border-gray-300">
                {/* Mobile Sort Options */}
                <div className="md:hidden bg-gray-200 px-3 py-2 flex items-center gap-2 text-xs">
                  <span className="text-gray-600">Sort by:</span>
                  <select 
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                  >
                    <option value="name">Name</option>
                    <option value="sex">Sex</option>
                    <option value="age">Age</option>
                    <option value="playerName">Player</option>
                    <option value="status">Status</option>
                    <option value="lastPostDate">Last Post</option>
                    <option value="totalPosts">Posts</option>
                  </select>
                  <button 
                    onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                    className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                  >
                    {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>

                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                      <SortableHeader field="name" className="text-left w-[200px]">Character</SortableHeader>
                      <SortableHeader field="sex" className="text-left">Sex</SortableHeader>
                      <SortableHeader field="age" className="text-left">Age</SortableHeader>
                      <SortableHeader field="playerName" className="text-left">Player</SortableHeader>
                      <SortableHeader field="status" className="text-center">Status</SortableHeader>
                      <SortableHeader field="lastPostDate" className="text-center">Last Post</SortableHeader>
                      <SortableHeader field="totalPosts" className="text-center">Posts</SortableHeader>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInactiveCharacters.map(char => (
                      <CharacterRow key={char.id} char={char} />
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-300">
                  {sortedInactiveCharacters.map(char => (
                    <CharacterCard key={char.id} char={char} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Inactivation Tab */}
        {activeTab === 'pending' && (
          <div className="mt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <p className="text-sm text-gray-600">
                These active characters have not posted in a roleplay region for 30 or more days. 
                You can mark them as inactive individually or select multiple to inactivate in bulk.
                <br />
                <span className="text-xs text-gray-500">
                  Note: Characters will be automatically reactivated if they post again.
                </span>
              </p>
              {charactersToInactivate.length > 0 && (
                <button
                  onClick={handleBulkInactivate}
                  disabled={selectedForInactivation.size === 0}
                  className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Inactivate Selected ({selectedForInactivation.size})
                </button>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : charactersToInactivate.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                All active characters have posted within the last 30 days. 🎉
              </div>
            ) : (
              <div className="border border-gray-300">
                {/* Mobile Sort Options & Select All */}
                <div className="md:hidden bg-gray-200 px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedForInactivation.size === charactersToInactivate.length && charactersToInactivate.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-600">Select All</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                    >
                      <option value="name">Name</option>
                      <option value="sex">Sex</option>
                      <option value="age">Age</option>
                      <option value="playerName">Player</option>
                      <option value="lastPostDate">Last Post</option>
                      <option value="totalPosts">Posts</option>
                    </select>
                    <button 
                      onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                      className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                    >
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>

                {/* Desktop Table View */}
                <table className="hidden md:table w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                      <th className="px-3 py-2 text-center border-r border-gray-300 w-10">
                        <input
                          type="checkbox"
                          checked={selectedForInactivation.size === charactersToInactivate.length && charactersToInactivate.length > 0}
                          onChange={selectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <SortableHeader field="name" className="text-left w-[200px]">Character</SortableHeader>
                      <SortableHeader field="sex" className="text-left">Sex</SortableHeader>
                      <SortableHeader field="age" className="text-left">Age</SortableHeader>
                      <SortableHeader field="playerName" className="text-left">Player</SortableHeader>
                      <th className="px-3 py-2 text-center border-r border-gray-300">Status</th>
                      <SortableHeader field="lastPostDate" className="text-center">Last Post</SortableHeader>
                      <SortableHeader field="totalPosts" className="text-center">Posts</SortableHeader>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCharactersToInactivate.map(char => (
                      <CharacterRow 
                        key={char.id} 
                        char={{...char, status: 'Inactive'}} 
                        showInactivateAction 
                        showCheckbox 
                      />
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-300">
                  {sortedCharactersToInactivate.map(char => (
                    <CharacterCard 
                      key={char.id} 
                      char={{...char, status: 'Inactive'}} 
                      showInactivateAction 
                      showCheckbox 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Mark as Dead Modal */}
      {showDeathModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4 border border-gray-300 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Mark Character as Dead</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to mark <strong>{showDeathModal.name}</strong> as dead? 
              Dead characters cannot post in roleplay regions.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Date of death will be recorded as <strong>{formatHorizonYear(getHorizonDate().year)}, {getHorizonDate().phase.name}</strong>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeathModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsDead}
                disabled={processingId === showDeathModal.id}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50"
              >
                {processingId === showDeathModal.id ? 'Processing...' : 'Mark as Dead'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
};

export default InactiveCharacters;
