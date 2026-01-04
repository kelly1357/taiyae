import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Region {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  subareas: { id: string; name: string }[];
}

const RegionDirectory: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Partial<Region>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/region');
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      }
    } catch (error) {
      console.error('Failed to fetch regions', error);
    }
  };

  const handleCreate = () => {
    setCurrentRegion({
      name: '',
      description: '',
      imageUrl: '',
      subareas: []
    });
    setIsEditing(true);
  };

  const handleEdit = (region: Region) => {
    setCurrentRegion(region);
    setIsEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRegion(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        const errorText = await response.text();
        alert(`Image upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading image', error);
      alert(`Image upload failed: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = currentRegion.id 
        ? `/api/region/${currentRegion.id}`
        : '/api/region';
      
      const method = currentRegion.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRegion)
      });

      if (response.ok) {
        setIsEditing(false);
        fetchRegions();
      } else {
        const errorText = await response.text();
        alert(`Failed to save region: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving region', error);
      alert(`Error saving region: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Region Directory</h1>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
        >
          Add New Region
        </button>
      </div>

      {isEditing && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white">{currentRegion.id ? 'Edit Region' : 'New Region'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Region Name</label>
              <input 
                type="text" 
                value={currentRegion.name || ''} 
                onChange={e => setCurrentRegion({...currentRegion, name: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
              <textarea 
                value={currentRegion.description || ''} 
                onChange={e => setCurrentRegion({...currentRegion, description: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white h-32 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Region Image</label>
              <div className="flex items-center space-x-4">
                {currentRegion.imageUrl && (
                  <img src={currentRegion.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded border border-gray-600" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
                {uploading && <span className="text-sm text-yellow-400 animate-pulse">Uploading...</span>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading || uploading}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Region'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map(region => (
          <div key={region.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
            {region.imageUrl ? (
              <img src={region.imageUrl} alt={region.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{region.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{region.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{region.subareas?.length || 0} Subareas</span>
                <div className="flex space-x-3">
                  <Link to={`/region/${region.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View
                  </Link>
                  <button 
                    onClick={() => handleEdit(region)}
                    className="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionDirectory;
