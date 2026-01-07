import React, { useState, useEffect } from 'react';
import type { Character, User } from '../types';

interface CharacterManagementProps {
  user: User;
}

const CharacterManagement: React.FC<CharacterManagementProps> = ({ user }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<{id: number, name: string}[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Partial<Character>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCharacters();
    fetchHealthStatuses();
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
    setIsEditing(true);
  };

  const handleCreate = () => {
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
        monthsAge: currentCharacter.monthsAge || 0,
        healthStatusId: currentCharacter.healthStatusId || 1
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setIsEditing(false);
        fetchCharacters();
      } else {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        alert(`Failed to save character: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving character', error);
      alert(`Error saving character: ${error}`);
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
          <h3 className="text-base font-semibold text-gray-900 mb-4">{currentCharacter.id ? 'Edit Character' : 'New Character'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
              <input 
                type="text" 
                value={currentCharacter.name || ''} 
                onChange={e => setCurrentCharacter({...currentCharacter, name: e.target.value})}
                className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Sex</label>
                <select 
                  value={currentCharacter.sex || 'Male'} 
                  onChange={e => setCurrentCharacter({...currentCharacter, sex: e.target.value as any})}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Age (Months)</label>
                <input 
                  type="number" 
                  value={currentCharacter.monthsAge || ''} 
                  onChange={e => setCurrentCharacter({...currentCharacter, monthsAge: parseInt(e.target.value)})}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
                  placeholder="e.g. 36"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium mb-1 text-gray-700">Avatar Image</label>
              <div className="flex items-center space-x-4">
                {currentCharacter.imageUrl && currentCharacter.imageUrl.trim() !== '' && !currentCharacter.imageUrl.includes('via.placeholder') ? (
                  <img src={currentCharacter.imageUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-300" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
                    <img 
                      src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                      alt="Placeholder" 
                      className="w-10 h-10 opacity-40"
                    />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {uploading && <span className="text-sm text-yellow-600">Uploading...</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Bio</label>
              <textarea 
                value={currentCharacter.bio || ''} 
                onChange={e => setCurrentCharacter({...currentCharacter, bio: e.target.value})}
                className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 h-32 focus:outline-none focus:border-[#2f3a2f]"
              />
            </div>

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
                <th className="px-4 py-2 text-left border-r border-gray-300">Avatar</th>
                <th className="px-4 py-2 text-left border-r border-gray-300">Name</th>
                <th className="px-4 py-2 text-left border-r border-gray-300">Pack</th>
                <th className="px-4 py-2 text-left border-r border-gray-300">Age</th>
                <th className="px-4 py-2 text-left border-r border-gray-300">Height</th>
                <th className="px-4 py-2 text-left border-r border-gray-300">Build</th>
                <th className="px-4 py-2 text-left border-r border-gray-300">Health</th>
                <th className="px-4 py-2 text-center">Skill Score</th>
              </tr>
            </thead>
            <tbody>
              {characters.map(char => (
                <tr key={char.id} className="border-t border-gray-300 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border-r border-gray-300">
                    <div className="flex flex-col items-center space-y-2">
                      {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') ? (
                        <img 
                          src={char.imageUrl} 
                          alt={char.name} 
                          className="w-12 h-12 rounded-full object-cover border border-gray-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
                          <img 
                            src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                            alt="Placeholder" 
                            className="w-8 h-8 opacity-40"
                          />
                        </div>
                      )}
                      <button 
                        onClick={() => handleEdit(char)}
                        className="text-xs text-[#2f3a2f] hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-300 font-semibold text-gray-900">{char.name}</td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.packName || 'Rogue'}</td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.age}</td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.height || 'N/A'}</td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.build || 'N/A'}</td>
                  <td className="px-4 py-3 border-r border-gray-300 text-gray-600">{char.healthStatus || 'Unknown'}</td>
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
