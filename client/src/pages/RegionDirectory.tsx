import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useIsAdmin, useUser } from '../contexts/UserContext';

interface Subarea {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  regionId: string;
}

interface Region {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  headerImageUrl?: string;
  subareas: Subarea[];
}

interface EditingSubarea {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  isNew: boolean;
}

const RegionDirectory: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Partial<Region>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingSubarea, setUploadingSubarea] = useState(false);
  const [editingSubarea, setEditingSubarea] = useState<EditingSubarea | null>(null);
  const [subareaLoading, setSubareaLoading] = useState(false);
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

  const handleSubareaImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingSubarea(true);

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });

      if (response.ok) {
        const data = await response.json();
        setEditingSubarea(prev => prev ? { ...prev, imageUrl: data.url } : null);
      } else {
        const errorText = await response.text();
        alert(`Subarea image upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading subarea image', error);
      alert(`Subarea image upload failed: ${error}`);
    } finally {
      setUploadingSubarea(false);
    }
  };

  const handleAddSubarea = () => {
    setEditingSubarea({
      name: '',
      description: '',
      imageUrl: '',
      isNew: true
    });
  };

  const handleEditSubarea = (subarea: Subarea) => {
    setEditingSubarea({
      id: subarea.id,
      name: subarea.name,
      description: subarea.description || '',
      imageUrl: subarea.imageUrl || '',
      isNew: false
    });
  };

  const handleSaveSubarea = async () => {
    if (!editingSubarea || !currentRegion.id) return;
    
    setSubareaLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Generate the region slug from region name
      const regionSlug = currentRegion.name?.toLowerCase().replace(/\s+/g, '-') || '';
      
      if (editingSubarea.isNew) {
        const response = await fetch('/api/subareas', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            regionId: regionSlug,
            name: editingSubarea.name,
            description: editingSubarea.description || null,
            imageUrl: editingSubarea.imageUrl || null
          })
        });

        if (response.ok) {
          const newSubarea = await response.json();
          setCurrentRegion(prev => ({
            ...prev,
            subareas: [...(prev.subareas || []), newSubarea]
          }));
          setEditingSubarea(null);
        } else {
          const errorText = await response.text();
          alert(`Failed to create subarea: ${errorText}`);
        }
      } else {
        const response = await fetch(`/api/subareas/${editingSubarea.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editingSubarea.name,
            description: editingSubarea.description || null,
            imageUrl: editingSubarea.imageUrl || null
          })
        });

        if (response.ok) {
          const updatedSubarea = await response.json();
          setCurrentRegion(prev => ({
            ...prev,
            subareas: prev.subareas?.map(s => 
              s.id === updatedSubarea.id ? updatedSubarea : s
            ) || []
          }));
          setEditingSubarea(null);
        } else {
          const errorText = await response.text();
          alert(`Failed to update subarea: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error saving subarea', error);
      alert(`Error saving subarea: ${error}`);
    } finally {
      setSubareaLoading(false);
    }
  };

  const handleDeleteSubarea = async (subareaId: string) => {
    if (!confirm('Are you sure you want to delete this subarea? This cannot be undone.')) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/subareas/${subareaId}`, {
        method: 'DELETE',
        headers: { 
          'X-Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCurrentRegion(prev => ({
          ...prev,
          subareas: prev.subareas?.filter(s => s.id !== subareaId) || []
        }));
      } else {
        const errorText = await response.text();
        alert(`Failed to delete subarea: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting subarea', error);
      alert(`Error deleting subarea: ${error}`);
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

                {/* Subareas Section - only show for existing regions */}
                {currentRegion.id && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">Subareas</label>
                      <button
                        type="button"
                        onClick={handleAddSubarea}
                        className="text-xs text-[#2f3a2f] hover:underline"
                      >
                        + Add Subarea
                      </button>
                    </div>
                    
                    {/* Existing subareas list */}
                    {currentRegion.subareas && currentRegion.subareas.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {currentRegion.subareas.map(subarea => (
                          <div key={subarea.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                            <div className="flex items-center space-x-3">
                              {subarea.imageUrl && (
                                <img src={subarea.imageUrl} alt={subarea.name} className="w-12 h-8 object-cover border border-gray-300" />
                              )}
                              <div>
                                <span className="text-sm font-medium text-gray-900">{subarea.name}</span>
                                {subarea.description && (
                                  <p className="text-xs text-gray-500 truncate max-w-md">{subarea.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSubarea(subarea)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                [edit]
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubarea(subarea.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                [delete]
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subarea edit form */}
                    {editingSubarea && (
                      <div className="p-3 bg-gray-100 border border-gray-300 space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                          {editingSubarea.isNew ? 'New Subarea' : 'Edit Subarea'}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Name</label>
                          <input
                            type="text"
                            value={editingSubarea.name}
                            onChange={e => setEditingSubarea({ ...editingSubarea, name: e.target.value })}
                            className="w-full border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            placeholder="Subarea name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description</label>
                          <textarea
                            value={editingSubarea.description}
                            onChange={e => setEditingSubarea({ ...editingSubarea, description: e.target.value })}
                            className="w-full border border-gray-300 px-2 py-1 text-sm text-gray-900 h-20 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            placeholder="Brief description of this subarea..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Background Image</label>
                          <div className="flex items-center space-x-3">
                            {editingSubarea.imageUrl && (
                              <img src={editingSubarea.imageUrl} alt="Preview" className="w-20 h-12 object-cover border border-gray-300" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSubareaImageUpload}
                              className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:border file:border-gray-300 file:text-xs file:bg-white file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                            />
                            {uploadingSubarea && <span className="text-xs text-gray-600 animate-pulse">Uploading...</span>}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingSubarea(null)}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveSubarea}
                            disabled={subareaLoading || uploadingSubarea || !editingSubarea.name.trim()}
                            className="bg-[#2f3a2f] hover:bg-[#3a4a3a] text-white px-3 py-1 text-xs disabled:opacity-50"
                          >
                            {subareaLoading ? 'Saving...' : 'Save Subarea'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                  <Link to={`/region/${region.slug}`}>
                    <img src={region.imageUrl} alt={region.name} className="w-full h-40 object-cover border-b border-gray-300 hover:opacity-90 transition-opacity" />
                  </Link>
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 border-b border-gray-300">
                    No Image
                  </div>
                )}
                
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3 leading-relaxed">{region.description}</p>
                    {region.subareas && region.subareas.length > 0 && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="text-gray-500">Subareas:</span>{' '}
                        {region.subareas.map((sub, index) => (
                          <span key={sub.id}>
                            <Link 
                              to={`/subarea/${sub.id}`}
                              className="font-medium text-gray-900 hover:text-[#4b6596]"
                            >
                              {sub.name}
                            </Link>
                            {index < region.subareas.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <Link to={`/region/${region.slug}`} className="text-gray-900 hover:underline text-sm font-bold">
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
