import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIsAdmin, useUser } from '../contexts/UserContext';

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
  const isAdmin = useIsAdmin();
  const userContext = useUser();
  // Debug: log admin context and user
  console.log('RegionDirectory admin check:', { isAdmin, user: userContext.user });

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
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://taiyaefiles.blob.core.windows.net/web/home.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gray-900/50" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">Region Directory</h1>
          {userContext.user?.isAdmin === true && (
            <button 
              onClick={handleCreate}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors shadow-lg"
            >
              Add New Region
            </button>
          )}
        </div>

        {isEditing && (
          <section className="border border-gray-300 bg-white mb-8 shadow-lg">
            <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
              <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
                {currentRegion.id ? 'Edit Region' : 'New Region'}
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Region Name</label>
                  <input 
                    type="text" 
                    value={currentRegion.name || ''} 
                    onChange={e => setCurrentRegion({...currentRegion, name: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                  <textarea 
                    value={currentRegion.description || ''} 
                    onChange={e => setCurrentRegion({...currentRegion, description: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 h-32 focus:border-gray-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Region Image</label>
                  <div className="flex items-center space-x-4">
                    {currentRegion.imageUrl && (
                      <img src={currentRegion.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded border border-gray-300" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                    />
                    {uploading && <span className="text-sm text-yellow-600 animate-pulse">Uploading...</span>}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
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
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map(region => (
            <section key={region.id} className="border border-gray-300 bg-white shadow-lg flex flex-col">
              <div className="bg-[#2f3a2f] px-4 py-2 flex justify-between items-center dark-header">
                <h3 className="text-xs font-normal uppercase tracking-wider text-[#fff9] truncate">
                  {region.name}
                </h3>
                <span className="text-[10px] text-gray-300 uppercase tracking-wider">
                  {region.subareas?.length || 0} Subareas
                </span>
              </div>
              
              {region.imageUrl ? (
                <img src={region.imageUrl} alt={region.name} className="w-full h-48 object-cover border-b border-gray-300" />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 border-b border-gray-300">
                  No Image
                </div>
              )}
              
              <div className="p-6 flex-grow flex flex-col justify-between">
                <p className="text-gray-800 text-sm mb-4 line-clamp-3 leading-relaxed">{region.description}</p>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Link to={`/region/${region.id}`} className="text-gray-900 hover:text-gray-700 text-sm font-bold uppercase tracking-wide">
                    View
                  </Link>
                  {isAdmin && (
                    <button 
                      onClick={() => handleEdit(region)}
                      className="text-green-700 hover:text-green-600 text-sm font-bold uppercase tracking-wide"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegionDirectory;
