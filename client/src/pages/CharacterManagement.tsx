import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Character, User } from '../types';

type SortField = 'name' | 'sex' | 'packName' | 'age' | 'totalSkill';
type SortDirection = 'asc' | 'desc';

interface CharacterManagementProps {
  user: User;
}

const CharacterManagement: React.FC<CharacterManagementProps> = ({ user }) => {
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

  useEffect(() => {
    fetchCharacters();
    fetchHealthStatuses();
    fetchHeights();
    fetchBuilds();
  }, [user.id]);

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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
    setUploading(true);

    try {
      // Upload to API
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
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
    setUploadingProfileImage(index);

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
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
                      <p className="text-xs text-gray-500 mt-1">Click to upload or drag images. These will be displayed on your character's profile page.</p>
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
          <table className="w-full border border-gray-300 text-sm bg-white">
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
              {sortedCharacters.map(char => (
                <tr key={char.id} className="border-t border-gray-300 hover:bg-gray-50 transition-colors align-top">
                  <td className="p-0 w-[25%] border-r border-gray-300 relative">
                    <div className="relative">
                      {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') && !imageErrors.has(char.id) ? (
                        <img 
                          src={char.imageUrl} 
                          alt={char.name} 
                          className="w-full object-cover block"
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
                      <span className="absolute top-0 left-0 text-white px-2 py-1 text-xs font-bold capitalize" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)' }}>
                        {char.name}
                      </span>
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
        </div>
      )}
      </section>
    </div>
  );
};

export default CharacterManagement;
