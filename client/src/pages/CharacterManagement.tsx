import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Character, User } from '../types';

type SortField = 'name' | 'sex' | 'packName' | 'age' | 'totalSkill';
type SortDirection = 'asc' | 'desc';

interface CharacterManagementProps {
  user: User;
}

const CharacterManagement: React.FC<CharacterManagementProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<{id: number, name: string}[]>([]);
  const [heights, setHeights] = useState<{id: number, name: string}[]>([]);
  const [builds, setBuilds] = useState<{id: number, name: string}[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [currentCharacter, setCurrentCharacter] = useState<Partial<Character>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState<number | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [ageYears, setAgeYears] = useState(0);
  const [ageMonths, setAgeMonths] = useState(0);
  const [unreadByCharacter, setUnreadByCharacter] = useState<Record<string, number>>({});
  const [inactiveSortField, setInactiveSortField] = useState<SortField>('name');
  const [inactiveSortDirection, setInactiveSortDirection] = useState<SortDirection>('asc');

  // Fetch unread message counts for inactive/dead characters
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/conversations/unread-counts?userId=${user.id}`, { headers: { 'X-Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setUnreadByCharacter(data.unreadByCharacter || {});
      }
    } catch (error) {
      console.error('Failed to fetch unread counts', error);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCharacters();
    fetchHealthStatuses();
    fetchHeights();
    fetchBuilds();
    fetchUnreadCounts();
  }, [user.id, fetchUnreadCounts]);

  // Check for ?new=true query param to open create form
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleCreate();
      // Remove the query param from URL
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchHealthStatuses = async () => {
    try {
      const response = await fetch('/api/health-statuses');
      if (response.ok) {
        const data = await response.json();
        setHealthStatuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch health statuses', error);
    }
  };

  const fetchHeights = async () => {
    try {
      const response = await fetch('/api/heights');
      if (response.ok) {
        const data = await response.json();
        setHeights(data);
      }
    } catch (error) {
      console.error('Failed to fetch heights', error);
    }
  };

  const fetchBuilds = async () => {
    try {
      const response = await fetch('/api/builds');
      if (response.ok) {
        const data = await response.json();
        setBuilds(data);
      }
    } catch (error) {
      console.error('Failed to fetch builds', error);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch(`/api/characters?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch characters', error);
    }
  };

  const handleEdit = (char: Character) => {
    setCurrentCharacter(char);
    setMessage({ type: '', text: '' });
    setIsEditing(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleInactiveSort = (field: SortField) => {
    if (inactiveSortField === field) {
      setInactiveSortDirection(inactiveSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setInactiveSortField(field);
      setInactiveSortDirection('asc');
    }
  };

  const handleToggleShowInDropdown = async (char: Character) => {
    console.log('Toggle clicked for character:', char.id, char.name);
    try {
      const newValue = !char.showInDropdown;
      console.log('Sending request with newValue:', newValue);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/characters/${char.id}/show-in-dropdown`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, showInDropdown: newValue })
      });
      
      console.log('Response status:', response.status);
      if (response.ok) {
        // Update local state
        setCharacters(prev => prev.map(c => 
          c.id === char.id ? { ...c, showInDropdown: newValue } : c
        ));
        setMessage({ 
          type: 'success', 
          text: newValue 
            ? `${char.name} can now be selected for posting` 
            : `${char.name} removed from posting dropdown`
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update character' });
      }
    } catch (error) {
      console.error('Failed to toggle showInDropdown', error);
      setMessage({ type: 'error', text: 'Failed to update character' });
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
  }, [characters, sortField, sortDirection]);

  const activeCharacters = useMemo(() => 
    sortedCharacters.filter(c => c.status !== 'Inactive' && c.status !== 'Dead'), 
    [sortedCharacters]
  );
  
  const sortedInactiveCharacters = useMemo(() => {
    const inactive = characters.filter(c => c.status === 'Inactive' || c.status === 'Dead');
    return [...inactive].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (inactiveSortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
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
        case 'totalSkill':
          aVal = a.totalSkill || 0;
          bVal = b.totalSkill || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return inactiveSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return inactiveSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [characters, inactiveSortField, inactiveSortDirection]);

  // Keep inactiveCharacters alias for backward compatibility
  const inactiveCharacters = sortedInactiveCharacters;

  const handleCreate = () => {
    setMessage({ type: '', text: '' });
    setAgeYears(0);
    setAgeMonths(0);
    setCurrentCharacter({
      userId: String(user.id),
      sex: 'Male',
      healthStatusId: 1, // Default to first status (usually Healthy)
      skillPoints: 0,
      achievements: [],
      imageUrl: '',
      monthsAge: 0
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = currentCharacter.id 
        ? `/api/characters/${currentCharacter.id}`
        : '/api/characters';
      
      const method = currentCharacter.id ? 'PUT' : 'POST';
      
      // Convert age string to months if needed, or just pass as is if backend handles it.
      // Backend expects monthsAge.
      // Let's assume the form inputs 'age' as a number of months for simplicity, 
      // or we parse "X years Y months".
      // For now, let's just send what we have and ensure backend can handle it or we adapt here.
      // My backend implementation expects 'monthsAge'.
      // Let's add a monthsAge field to the form or calculate it.
      
      const body = {
        ...currentCharacter,
        userId: user.id,
        monthsAge: currentCharacter.id ? currentCharacter.monthsAge : (ageYears * 12) + ageMonths,
        healthStatusId: currentCharacter.healthStatusId || 1
      };

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // For new characters, close the form. For existing, stay on the same character.
        if (!currentCharacter.id) {
          setIsEditing(false);
        }
        setMessage({ type: 'success', text: 'Character saved successfully.' });
        await fetchCharacters();
      } else {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        setMessage({ type: 'error', text: `Failed to save character: ${errorText}` });
      }
    } catch (error) {
      console.error('Error saving character', error);
      setMessage({ type: 'error', text: `Error saving character: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Check file size (1MB = 1,048,576 bytes)
    if (file.size > 1048576) {
      alert('Image must be 1MB or smaller.');
      e.target.value = '';
      return;
    }
    
    setUploading(true);

    try {
      // Upload to API
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'X-Authorization': `Bearer ${token}` },
        body: file
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCharacter(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        alert(`Image upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading image', error);
      alert(`Image upload failed: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Check file size (1MB = 1,048,576 bytes)
    if (file.size > 1048576) {
      alert('Image must be 1MB or smaller.');
      e.target.value = '';
      return;
    }
    
    setUploadingProfileImage(index);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'X-Authorization': `Bearer ${token}` },
        body: file
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCharacter(prev => {
          const images = [...(prev.profileImages || [])];
          images[index] = data.url;
          return { ...prev, profileImages: images };
        });
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        alert(`Image upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading image', error);
      alert(`Image upload failed: ${error}`);
    } finally {
      setUploadingProfileImage(null);
    }
  };

  const handleRemoveProfileImage = (index: number) => {
    setCurrentCharacter(prev => {
      const images = [...(prev.profileImages || [])];
      images.splice(index, 1);
      return { ...prev, profileImages: images };
    });
  };

  return (
    <div className="space-y-8">
      <section className="border border-gray-300 bg-white">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
            My Characters
          </h2>
          <button 
            onClick={handleCreate}
            className="bg-white/20 hover:bg-white/30 text-white text-xs uppercase tracking-wide px-3 py-1 transition-colors"
          >
            Create New Character
          </button>
        </div>

      {isEditing ? (
        <div className="px-4 py-4">
          <button 
            onClick={() => setIsEditing(false)} 
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline mb-4 block"
          >
            ← Back to My Characters
          </button>
          {message.text && (
            <div className={`p-3 mb-6 border text-sm ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
              {message.text}
            </div>
          )}
          <h3 className="text-base font-semibold text-gray-900 mb-4">{currentCharacter.id ? 'Edit Character' : 'New Character'}</h3>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Profile Section */}
            <div>
              <h4 className="uppercase text-sm font-normal tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 pt-4">Basic Profile</h4>
              <div className="space-y-4">
              <div className={`grid gap-4 ${currentCharacter.id ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">First Name</label>
                  {currentCharacter.id ? (
                    <>
                      <div className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-gray-900">
                        {currentCharacter.name}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">First name cannot be changed.</p>
                    </>
                  ) : (
                    <input 
                      type="text" 
                      value={currentCharacter.name || ''} 
                      onChange={e => setCurrentCharacter({...currentCharacter, name: e.target.value})}
                      className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                      placeholder="Do not include surname in this field"
                      required
                    />
                  )}
                </div>
                {currentCharacter.id && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Last Name</label>
                    <input 
                      type="text" 
                      value={currentCharacter.surname || ''} 
                      onChange={e => setCurrentCharacter({...currentCharacter, surname: e.target.value})}
                      className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                    />
                  </div>
                )}
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Sex</label>
                    {currentCharacter.id ? (
                      <>
                        <div className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-gray-900">
                          {currentCharacter.sex || 'Unknown'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sex cannot be changed.</p>
                      </>
                    ) : (
                      <select 
                        value={currentCharacter.sex || 'Male'} 
                        onChange={e => setCurrentCharacter({...currentCharacter, sex: e.target.value as any})}
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Age</label>
                    {currentCharacter.id ? (
                      <>
                        <div className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-gray-900">
                          {currentCharacter.age || 'Unknown'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Age cannot be changed.</p>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <select
                            value={ageYears}
                            onChange={e => setAgeYears(parseInt(e.target.value))}
                            className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                          >
                            {[...Array(16)].map((_, i) => (
                              <option key={i} value={i}>{i} {i === 1 ? 'year' : 'years'}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <select
                            value={ageMonths}
                            onChange={e => setAgeMonths(parseInt(e.target.value))}
                            className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i} value={i}>{i} {i === 1 ? 'month' : 'months'}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {currentCharacter.id && (
                  <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Health Status</label>
                      <select 
                        value={currentCharacter.healthStatusId || 1} 
                        onChange={e => setCurrentCharacter({...currentCharacter, healthStatusId: parseInt(e.target.value)})}
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                      >
                        {healthStatuses.map(status => (
                          <option key={status.id} value={status.id}>{status.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Spirit Symbol <Link to="/wiki/spirit-symbols" className="text-gray-400 hover:text-gray-600">(?)</Link>
                      </label>
                      <select 
                        value={currentCharacter.spiritSymbol || ''} 
                        onChange={e => setCurrentCharacter({...currentCharacter, spiritSymbol: e.target.value})}
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                      >
                        <option value="">Select a symbol...</option>
                        <option value="hoof">Hoof</option>
                        <option value="leaf">Leaf</option>
                        <option value="feather">Feather</option>
                        <option value="eye">Eye</option>
                        <option value="stone">Stone</option>
                        <option value="print">Print</option>
                        <option value="antler">Antler</option>
                        <option value="bone">Bone</option>
                        <option value="fang">Fang</option>
                      </select>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>

            {/* Additional fields only shown when editing existing character */}
            {currentCharacter.id && (
              <>
                {/* Physical Traits Section */}
                <div>
                  <h4 className="uppercase text-sm font-normal tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 pt-4">Physical Traits</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Avatar Image</label>
                      <div className="flex items-start space-x-4">
                        <div className="w-64 flex-shrink-0">
                          {currentCharacter.imageUrl && currentCharacter.imageUrl.trim() !== '' && !currentCharacter.imageUrl.includes('via.placeholder') ? (
                            <img 
                              src={currentCharacter.imageUrl} 
                              alt="Preview" 
                              className="w-full object-cover border border-gray-300"
                              style={{ aspectRatio: '16/9' }}
                            />
                          ) : (
                            <div 
                              className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center"
                              style={{ aspectRatio: '16/9' }}
                            >
                              <img 
                                src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                                alt="Placeholder" 
                                className="w-12 h-12 opacity-40"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                          <span className="text-xs text-gray-500">Max file size: 1MB.</span>
                          {uploading && <span className="text-sm text-yellow-600">Uploading...</span>}
                        </div>
                      </div>
                    </div>

                    {/* Profile Images Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Profile Images (up to 4)</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map((index) => {
                          const imageUrl = currentCharacter.profileImages?.[index];
                          return (
                            <div key={index} className="relative group">
                              {imageUrl ? (
                                <div className="relative">
                                  <img 
                                    src={imageUrl} 
                                    alt={`Profile ${index + 1}`}
                                    className="w-full h-24 object-cover border border-gray-300 rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProfileImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove image"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                                  {uploadingProfileImage === index ? (
                                    <span className="text-sm text-yellow-600">Uploading...</span>
                                  ) : (
                                    <>
                                      <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                      </svg>
                                      <span className="text-xs text-gray-500">Add Image</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleProfileImageUpload(e, currentCharacter.profileImages?.length || 0)}
                                    className="hidden"
                                    disabled={uploadingProfileImage !== null}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Click to upload or drag images. Max file size: 1MB.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Height</label>
                        <select 
                          value={(currentCharacter as any).heightId || ''} 
                          onChange={e => setCurrentCharacter({...currentCharacter, heightId: e.target.value ? parseInt(e.target.value) : undefined} as any)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                        >
                          <option value="">-- Select --</option>
                          {heights.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Build</label>
                        <select 
                          value={(currentCharacter as any).buildId || ''} 
                          onChange={e => setCurrentCharacter({...currentCharacter, buildId: e.target.value ? parseInt(e.target.value) : undefined} as any)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                        >
                          <option value="">-- Select --</option>
                          {builds.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Section */}
                <div>
                  <h4 className="uppercase text-sm font-normal tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 pt-4">Background</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Birthplace</label>
                      <input 
                        type="text" 
                        value={(currentCharacter as any).birthplace || ''} 
                        onChange={e => setCurrentCharacter({...currentCharacter, birthplace: e.target.value} as any)}
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Character Information</label>
                      <textarea 
                        value={currentCharacter.bio || ''} 
                        onChange={e => setCurrentCharacter({...currentCharacter, bio: e.target.value})}
                        className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 h-32 focus:outline-none focus:border-[#2f3a2f]"
                        placeholder="Not sure where to start? Consider including sections for Appearance, Personality, and History."
                      />
                    </div>
                  </div>
                </div>

                {/* Relationships Section */}
                <div>
                  <h4 className="uppercase text-sm font-normal tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4 pt-4">Relationships</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Father</label>
                        <input 
                          type="text" 
                          value={(currentCharacter as any).father || ''} 
                          onChange={e => setCurrentCharacter({...currentCharacter, father: e.target.value} as any)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Mother</label>
                        <input 
                          type="text" 
                          value={(currentCharacter as any).mother || ''} 
                          onChange={e => setCurrentCharacter({...currentCharacter, mother: e.target.value} as any)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Siblings</label>
                        <input 
                          type="text" 
                          value={(currentCharacter as any).siblings || ''} 
                          onChange={e => setCurrentCharacter({...currentCharacter, siblings: e.target.value} as any)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Pups</label>
                        <input 
                          type="text" 
                          value={(currentCharacter as any).pups || ''} 
                          onChange={e => setCurrentCharacter({...currentCharacter, pups: e.target.value} as any)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading || uploading}
                className="bg-[#2f3a2f] hover:bg-[#3d4a3d] text-white px-4 py-2 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Character'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Mobile Sort Options */}
          <div className="md:hidden bg-gray-200 border border-gray-300 px-3 py-2 flex items-center gap-2 text-xs mb-4">
            <span className="text-gray-600">Sort by:</span>
            <select 
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
            >
              <option value="name">Name</option>
              <option value="sex">Sex</option>
              <option value="packName">Pack</option>
              <option value="age">Age</option>
              <option value="totalSkill">Skill Score</option>
            </select>
            <button 
              onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
              className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
            >
              {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>

          {/* Desktop Table View */}
          <table className="hidden md:table w-full border border-gray-300 text-sm bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                <th 
                  className={`px-4 py-2 text-left border-r border-gray-300 w-[25%] cursor-pointer hover:bg-gray-300 select-none ${sortField === 'name' ? 'bg-gray-300' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Character
                </th>
                <th 
                  className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${sortField === 'sex' ? 'bg-gray-300' : ''}`}
                  onClick={() => handleSort('sex')}
                >
                  Sex
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
                  className={`px-4 py-2 text-center cursor-pointer hover:bg-gray-300 select-none ${sortField === 'totalSkill' ? 'bg-gray-300' : ''}`}
                  onClick={() => handleSort('totalSkill')}
                >
                  Skill Score
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCharacters.map(char => (
                <tr key={char.id} className="border-t border-gray-300 hover:bg-gray-50 transition-colors align-top">
                  <td className="p-0 w-[25%] border-r border-gray-300 relative">
                    <div className="relative">
                      <Link to={`/character/${char.slug || char.id}`}>
                        {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') && !imageErrors.has(char.id) ? (
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="w-full object-cover block hover:opacity-90 transition-opacity"
                            style={{ aspectRatio: '16/9' }}
                            onError={() => setImageErrors(prev => new Set(prev).add(char.id))}
                          />
                        ) : (
                          <div 
                            className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:opacity-90 transition-opacity"
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
                      <button 
                        onClick={() => handleEdit(char)}
                        className="absolute bottom-2 right-2 text-xs bg-white/90 hover:bg-white text-[#2f3a2f] px-2 py-1 font-medium border border-gray-300"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className={`px-4 py-3 border-r border-gray-300 ${char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>{char.sex || 'Unknown'}</td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">
                    {char.packName ? char.packName : (
                      <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.age}</td>
                  <td className="px-4 py-3">
                    <div className="border border-gray-300 text-xs text-center w-48 mx-auto">
                      <div className="grid grid-cols-4 bg-gray-200 text-gray-700 font-semibold">
                        <div className="p-1 border-r border-gray-300">Exp</div>
                        <div className="p-1 border-r border-gray-300">Phys</div>
                        <div className="p-1 border-r border-gray-300">Know</div>
                        <div className="p-1">Total</div>
                      </div>
                      <div className="grid grid-cols-4 bg-white text-gray-800">
                        <div className="p-1 border-r border-gray-300">{char.experience || 0}</div>
                        <div className="p-1 border-r border-gray-300">{char.physical || 0}</div>
                        <div className="p-1 border-r border-gray-300">{char.knowledge || 0}</div>
                        <div className="p-1 font-bold">{char.totalSkill || 0}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View for Active Characters */}
          <div className="md:hidden border border-gray-300 divide-y divide-gray-300">
            {activeCharacters.map(char => (
              <div key={char.id} className="p-3 hover:bg-gray-50">
                <div className="flex gap-3">
                  {/* Character Image */}
                  <Link to={`/character/${char.slug || char.id}`} className="flex-shrink-0 w-20 relative">
                    {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') && !imageErrors.has(char.id) ? (
                      <img 
                        src={char.imageUrl} 
                        alt={char.name} 
                        className="w-full object-cover rounded"
                        style={{ aspectRatio: '1/1' }}
                        onError={() => setImageErrors(prev => new Set(prev).add(char.id))}
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
                  </Link>

                  {/* Character Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/character/${char.slug || char.id}`} className="font-semibold text-gray-900 hover:underline">
                      {char.name}
                    </Link>
                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-600'}>
                          {char.sex === 'Male' ? '♂' : char.sex === 'Female' ? '♀' : '—'} {char.sex || 'Unknown'}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span>{char.age}</span>
                      </div>
                      <div>
                        {char.packName ? char.packName : (
                          <span className="uppercase tracking-wide text-gray-500" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <span className="font-medium">SP:</span>
                        <span>{char.experience || 0}</span>/<span>{char.physical || 0}</span>/<span>{char.knowledge || 0}</span>
                        <span className="font-bold ml-1">= {char.totalSkill || 0}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEdit(char)}
                      className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 text-[#2f3a2f] px-3 py-1 font-medium border border-gray-300"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inactive Characters Section */}
          {inactiveCharacters.length > 0 && (
            <>
              <hr className="my-6 border-gray-300" />
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Inactive & Dead Characters</h3>
              
              {/* Desktop Table View */}
              <table className="hidden md:table w-full border border-gray-300 text-sm bg-white">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 w-[25%] cursor-pointer hover:bg-gray-300 select-none ${inactiveSortField === 'name' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleInactiveSort('name')}
                    >Character</th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${inactiveSortField === 'sex' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleInactiveSort('sex')}
                    >Sex</th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${inactiveSortField === 'packName' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleInactiveSort('packName')}
                    >Pack</th>
                    <th 
                      className={`px-4 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none ${inactiveSortField === 'age' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleInactiveSort('age')}
                    >Age</th>
                    <th 
                      className={`px-4 py-2 text-center cursor-pointer hover:bg-gray-300 select-none ${inactiveSortField === 'totalSkill' ? 'bg-gray-300' : ''}`}
                      onClick={() => handleInactiveSort('totalSkill')}
                    >Skill Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInactiveCharacters.map(char => (
                    <tr key={char.id} className="border-t border-gray-300 hover:bg-gray-50 transition-colors align-top">
                          <td className="p-0 w-[25%] border-r border-gray-300 relative">
                            <div className="relative">
                              <Link to={`/character/${char.slug || char.id}`}>
                                {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') && !imageErrors.has(char.id) ? (
                                  <img 
                                    src={char.imageUrl} 
                                    alt={char.name} 
                                    className="w-full object-cover block hover:opacity-90 transition-opacity"
                                style={{ aspectRatio: '16/9' }}
                                onError={() => setImageErrors(prev => new Set(prev).add(char.id))}
                              />
                            ) : (
                              <div 
                                className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:opacity-90 transition-opacity"
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
                          <span className={`absolute top-0 right-0 px-2 py-1 text-xs font-bold ${
                            char.status === 'Dead' ? 'bg-gray-800 text-gray-200' : 'bg-yellow-600 text-white'
                          }`}>
                            {char.status}
                          </span>
                          {/* Unread messages badge */}
                          {unreadByCharacter[char.id] > 0 && (
                            <span 
                              className="absolute top-8 right-0 bg-red-500 text-white text-xs font-bold rounded-l-full min-w-[20px] h-5 flex items-center justify-center px-1.5 pl-2 shadow-lg"
                              title={`${unreadByCharacter[char.id]} unread message${unreadByCharacter[char.id] > 1 ? 's' : ''}`}
                            >
                              ✉ {unreadByCharacter[char.id]}
                            </span>
                          )}
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            {char.status !== 'Dead' && (
                              <button 
                                onClick={() => handleToggleShowInDropdown(char)}
                                className={`text-xs px-2 py-1 font-medium border ${
                                  char.showInDropdown 
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' 
                                    : 'bg-white/90 hover:bg-white text-gray-600 border-gray-300'
                                }`}
                                title={char.showInDropdown ? 'Remove from posting dropdown' : 'Enable for posting'}
                              >
                                {char.showInDropdown ? '✓ Posting' : 'Enable Posting'}
                              </button>
                            )}
                            <button 
                              onClick={() => handleEdit(char)}
                              className="text-xs bg-white/90 hover:bg-white text-[#2f3a2f] px-2 py-1 font-medium border border-gray-300"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 border-r border-gray-300 ${char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>{char.sex || 'Unknown'}</td>
                      <td className="px-4 py-3 border-r border-gray-300 text-gray-600">
                        {char.packName ? char.packName : (
                          <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.age}</td>
                      <td className="px-4 py-3">
                        <div className="border border-gray-300 text-xs text-center w-48 mx-auto">
                          <div className="grid grid-cols-4 bg-gray-200 text-gray-700 font-semibold">
                            <div className="p-1 border-r border-gray-300">Exp</div>
                            <div className="p-1 border-r border-gray-300">Phys</div>
                            <div className="p-1 border-r border-gray-300">Know</div>
                            <div className="p-1">Total</div>
                          </div>
                          <div className="grid grid-cols-4 bg-white text-gray-800">
                            <div className="p-1 border-r border-gray-300">{char.experience || 0}</div>
                            <div className="p-1 border-r border-gray-300">{char.physical || 0}</div>
                            <div className="p-1 border-r border-gray-300">{char.knowledge || 0}</div>
                            <div className="p-1 font-bold">{char.totalSkill || 0}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View for Inactive Characters */}
              <div className="md:hidden border border-gray-300 divide-y divide-gray-300">
                {inactiveCharacters.map(char => (
                  <div key={char.id} className="p-3 hover:bg-gray-50">
                    <div className="flex gap-3">
                      {/* Character Image */}
                      <Link to={`/character/${char.slug || char.id}`} className="flex-shrink-0 w-20 relative">
                        {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') && !imageErrors.has(char.id) ? (
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="w-full object-cover rounded"
                            style={{ aspectRatio: '1/1' }}
                            onError={() => setImageErrors(prev => new Set(prev).add(char.id))}
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
                          char.status === 'Dead' ? 'bg-gray-800 text-gray-200' : 'bg-yellow-600 text-white'
                        }`}>
                          {char.status}
                        </span>
                        {/* Unread badge */}
                        {unreadByCharacter[char.id] > 0 && (
                          <span 
                            className="absolute bottom-0 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center px-1 rounded-tl"
                            title={`${unreadByCharacter[char.id]} unread message${unreadByCharacter[char.id] > 1 ? 's' : ''}`}
                          >
                            ✉ {unreadByCharacter[char.id]}
                          </span>
                        )}
                      </Link>

                      {/* Character Info */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/character/${char.slug || char.id}`} className="font-semibold text-gray-900 hover:underline">
                          {char.name}
                        </Link>
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={char.sex === 'Male' ? 'text-blue-600' : char.sex === 'Female' ? 'text-pink-500' : 'text-gray-600'}>
                              {char.sex === 'Male' ? '♂' : char.sex === 'Female' ? '♀' : '—'} {char.sex || 'Unknown'}
                            </span>
                            <span className="text-gray-400">·</span>
                            <span>{char.age}</span>
                          </div>
                          <div>
                            {char.packName ? char.packName : (
                              <span className="uppercase tracking-wide text-gray-500" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <span className="font-medium">SP:</span>
                            <span>{char.experience || 0}</span>/<span>{char.physical || 0}</span>/<span>{char.knowledge || 0}</span>
                            <span className="font-bold ml-1">= {char.totalSkill || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {char.status !== 'Dead' && (
                            <button 
                              onClick={() => handleToggleShowInDropdown(char)}
                              className={`text-xs px-2 py-1 font-medium border ${
                                char.showInDropdown 
                                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300'
                              }`}
                            >
                              {char.showInDropdown ? '✓ Posting' : 'Enable'}
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(char)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-[#2f3a2f] px-3 py-1 font-medium border border-gray-300"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      </section>
    </div>
  );
};

export default CharacterManagement;
