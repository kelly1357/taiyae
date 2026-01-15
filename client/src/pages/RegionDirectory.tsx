import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIsAdmin, useUser } from '../contexts/UserContext';

interface Region {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  headerImageUrl?: string;
  subareas: { id: string; name: string }[];
}

const RegionDirectory: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Partial<Region>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
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
      headerImageUrl: '',
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

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingHeader(true);

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRegion(prev => ({ ...prev, headerImageUrl: data.url }));
      } else {
        const errorText = await response.text();
        alert(`Header image upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading header image', error);
      alert(`Header image upload failed: ${error}`);
    } finally {
      setUploadingHeader(false);
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
    <div className="space-y-8">
      <section className="border border-gray-300 bg-white">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
            Region Directory
          </h2>
          {userContext.user?.isAdmin === true && (
            <button 
              onClick={handleCreate}
              className="text-xs uppercase tracking-wide text-white hover:underline"
            >
              + Add New Region
            </button>
          )}
        </div>

        {isEditing && (
          <div className="border-b border-gray-300">
            <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                {currentRegion.id ? 'Edit Region' : 'New Region'}
              </h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Region Name</label>
                  <input 
                    type="text" 
                    value={currentRegion.name || ''} 
                    onChange={e => setCurrentRegion({...currentRegion, name: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Description</label>
                  <textarea 
                    value={currentRegion.description || ''} 
                    onChange={e => setCurrentRegion({...currentRegion, description: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 h-32 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Region Background Image</label>
                  <p className="text-xs text-gray-500 mb-2">This image displays as the page background when viewing the region.</p>
                  <div className="flex items-center space-x-4">
                    {currentRegion.imageUrl && (
                      <img src={currentRegion.imageUrl} alt="Preview" className="w-32 h-20 object-cover border border-gray-300" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                    />
                    {uploading && <span className="text-sm text-gray-600 animate-pulse">Uploading...</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Region Header Image</label>
                  <p className="text-xs text-gray-500 mb-2">This image displays on the homepage above the region's thread info.</p>
                  <div className="flex items-center space-x-4">
                    {currentRegion.headerImageUrl && (
                      <img src={currentRegion.headerImageUrl} alt="Header Preview" className="w-32 h-20 object-cover border border-gray-300" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleHeaderImageUpload}
                      className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                    />
                    {uploadingHeader && <span className="text-sm text-gray-600 animate-pulse">Uploading...</span>}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || uploading || uploadingHeader}
                    className="bg-[#2f3a2f] hover:bg-[#3a4a3a] text-white px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Region'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Regions Grid with Images */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map(region => (
              <div key={region.id} className="border border-gray-300 bg-white flex flex-col">
                <div className="bg-gray-200 px-4 py-2 flex justify-between items-center border-b border-gray-300">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 truncate">
                    {region.name}
                  </h3>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {region.subareas?.length || 0} Subareas
                  </span>
                </div>
                
                {region.imageUrl ? (
                  <Link to={`/region/${region.id}`}>
                    <img src={region.imageUrl} alt={region.name} className="w-full h-40 object-cover border-b border-gray-300 hover:opacity-90 transition-opacity" />
                  </Link>
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 border-b border-gray-300">
                    No Image
                  </div>
                )}
                
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3 leading-relaxed">{region.description}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <Link to={`/region/${region.id}`} className="text-gray-900 hover:underline text-sm font-bold">
                      View Region
                    </Link>
                    {isAdmin && (
                      <button 
                        onClick={() => handleEdit(region)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        [edit]
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegionDirectory;
