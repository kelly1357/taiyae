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
      userId: user.id,
      sex: 'Male',
      healthStatusId: 1, // Default to first status (usually Healthy)
      skillPoints: 0,
      achievements: [],
      imageUrl: 'https://via.placeholder.com/150', // Default
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Characters</h1>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create New Character
        </button>
      </div>

      {isEditing ? (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">{currentCharacter.id ? 'Edit Character' : 'New Character'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input 
                type="text" 
                value={currentCharacter.name || ''} 
                onChange={e => setCurrentCharacter({...currentCharacter, name: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sex</label>
                <select 
                  value={currentCharacter.sex || 'Male'} 
                  onChange={e => setCurrentCharacter({...currentCharacter, sex: e.target.value as any})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age (Months)</label>
                <input 
                  type="number" 
                  value={currentCharacter.monthsAge || ''} 
                  onChange={e => setCurrentCharacter({...currentCharacter, monthsAge: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                  placeholder="e.g. 36"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Health Status</label>
              <select 
                value={currentCharacter.healthStatusId || 1} 
                onChange={e => setCurrentCharacter({...currentCharacter, healthStatusId: parseInt(e.target.value)})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                {healthStatuses.map(status => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avatar Image</label>
              <div className="flex items-center space-x-4">
                {currentCharacter.imageUrl && (
                  <img src={currentCharacter.imageUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
                {uploading && <span className="text-sm text-yellow-400">Uploading...</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea 
                value={currentCharacter.bio || ''} 
                onChange={e => setCurrentCharacter({...currentCharacter, bio: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white h-32"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading || uploading}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Character'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(char => (
            <div key={char.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
              <div className="h-32 bg-gray-800 relative">
                <img 
                  src={char.imageUrl} 
                  alt={char.name} 
                  className="absolute bottom-0 left-4 transform translate-y-1/2 w-20 h-20 rounded-full border-4 border-gray-900 object-cover"
                />
              </div>
              <div className="pt-12 pb-6 px-6">
                <h3 className="text-xl font-bold">{char.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{char.sex} • {char.age}</p>
                <p className="text-gray-300 text-sm line-clamp-3 mb-4">{char.bio || 'No bio available.'}</p>
                <button 
                  onClick={() => handleEdit(char)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded border border-gray-600"
                >
                  Edit Character
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterManagement;
