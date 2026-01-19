import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { spiritSymbols } from '../data/spiritSymbolQuiz';
import RichTextEditor from '../components/RichTextEditor';

interface Adoptable {
  id: number;
  characterName: string;
  imageUrl: string | null;
  sex: string;
  birthplace: string | null;
  ageYears: number;
  ageMonths: number;
  parents: string | null;
  heightId: number | null;
  height: string | null;
  buildId: number | null;
  build: string | null;
  spiritSymbol: string | null;
  coatColor1: string | null;
  coatColor2: string | null;
  coatColor3: string | null;
  coatColor4: string | null;
  eyeColor: string | null;
  siblings: string | null;
  characterInfo: string | null;
  createdByUserId: number;
  createdByUsername: string;
  createdAt: string;
}

interface HeightOption {
  id: number;
  name: string;
}

interface BuildOption {
  id: number;
  name: string;
}

interface AdoptableFormData {
  characterName: string;
  imageUrl: string;
  sex: string;
  birthplace: string;
  ageYears: number;
  ageMonths: number;
  parents: string;
  heightId: number | null;
  buildId: number | null;
  spiritSymbol: string;
  coatColor1: string;
  coatColor2: string;
  coatColor3: string;
  coatColor4: string;
  eyeColor: string;
  siblings: string;
  characterInfo: string;
}

const initialFormData: AdoptableFormData = {
  characterName: '',
  imageUrl: '',
  sex: '',
  birthplace: '',
  ageYears: 0,
  ageMonths: 0,
  parents: '',
  heightId: null,
  buildId: null,
  spiritSymbol: '',
  coatColor1: '#000000',
  coatColor2: '#000000',
  coatColor3: '#000000',
  coatColor4: '#000000',
  eyeColor: '#000000',
  siblings: '',
  characterInfo: '',
};

const Adopt: React.FC = () => {
  const { user } = useUser();
  const [adoptables, setAdoptables] = useState<Adoptable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdoptable, setEditingAdoptable] = useState<Adoptable | null>(null);
  const [formData, setFormData] = useState<AdoptableFormData>(initialFormData);
  const [heights, setHeights] = useState<HeightOption[]>([]);
  const [builds, setBuilds] = useState<BuildOption[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchAdoptables();
    fetchHeightsAndBuilds();
  }, []);

  const fetchAdoptables = async () => {
    try {
      const response = await fetch('/api/adoptables');
      if (response.ok) {
        const data = await response.json();
        setAdoptables(data);
      }
    } catch (error) {
      console.error('Failed to fetch adoptables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHeightsAndBuilds = async () => {
    try {
      const [heightsRes, buildsRes] = await Promise.all([
        fetch('/api/heights'),
        fetch('/api/builds'),
      ]);
      if (heightsRes.ok) {
        const data = await heightsRes.json();
        setHeights(data);
      }
      if (buildsRes.ok) {
        const data = await buildsRes.json();
        setBuilds(data);
      }
    } catch (error) {
      console.error('Failed to fetch heights/builds:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1MB limit)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      alert('File size must be less than 1MB');
      e.target.value = '';
      return;
    }

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAdoptable(null);
    setFormData(initialFormData);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (adoptable: Adoptable) => {
    setEditingAdoptable(adoptable);
    setImagePreview(null);
    setFormData({
      characterName: adoptable.characterName,
      imageUrl: adoptable.imageUrl || '',
      sex: adoptable.sex,
      birthplace: adoptable.birthplace || '',
      ageYears: adoptable.ageYears,
      ageMonths: adoptable.ageMonths,
      parents: adoptable.parents || '',
      heightId: adoptable.heightId,
      buildId: adoptable.buildId,
      spiritSymbol: adoptable.spiritSymbol || '',
      coatColor1: adoptable.coatColor1 || '#000000',
      coatColor2: adoptable.coatColor2 || '#000000',
      coatColor3: adoptable.coatColor3 || '#000000',
      coatColor4: adoptable.coatColor4 || '#000000',
      eyeColor: adoptable.eyeColor || '#000000',
      siblings: adoptable.siblings || '',
      characterInfo: adoptable.characterInfo || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (adoptable: Adoptable) => {
    if (!confirm(`Are you sure you want to delete ${adoptable.characterName}?`)) return;

    try {
      const response = await fetch(`/api/adoptables/${adoptable.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingUserId: user?.id,
          isModerator: user?.isModerator || user?.isAdmin,
        }),
      });
      if (response.ok) {
        setAdoptables(prev => prev.filter(a => a.id !== adoptable.id));
      }
    } catch (error) {
      console.error('Failed to delete adoptable:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to create an adoptable');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        characterName: formData.characterName,
        imageUrl: formData.imageUrl || null,
        sex: formData.sex,
        birthplace: formData.birthplace || null,
        ageYears: formData.ageYears,
        ageMonths: formData.ageMonths,
        parents: formData.parents || null,
        heightId: formData.heightId,
        buildId: formData.buildId,
        spiritSymbol: formData.spiritSymbol || null,
        coatColor1: formData.coatColor1 || null,
        coatColor2: formData.coatColor2 || null,
        coatColor3: formData.coatColor3 || null,
        coatColor4: formData.coatColor4 || null,
        eyeColor: formData.eyeColor || null,
        siblings: formData.siblings || null,
        characterInfo: formData.characterInfo || null,
        requestingUserId: user.id,
        isModerator: user.isModerator || user.isAdmin,
        createdByUserId: editingAdoptable ? editingAdoptable.createdByUserId : user.id,
      };

      console.log('Submitting payload:', payload);

      const url = editingAdoptable
        ? `/api/adoptables/${editingAdoptable.id}`
        : '/api/adoptables';
      const method = editingAdoptable ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setImagePreview(null);
        fetchAdoptables();
      } else {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        alert(`Failed to save: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save adoptable:', error);
      alert('Failed to save adoptable. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = (adoptable: Adoptable) => {
    if (!user) return false;
    return user.id === adoptable.createdByUserId || user.isModerator || user.isAdmin;
  };

  const formatAge = (years: number, months: number) => {
    const parts = [];
    if (years > 0) parts.push(`${years} yr${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mo${months !== 1 ? 's' : ''}`);
    return parts.join(', ') || '0 mos';
  };

  const getSpiritSymbolImage = (symbolName: string | null) => {
    if (!symbolName) return null;
    const symbol = spiritSymbols.find(s => s.name.toLowerCase() === symbolName.toLowerCase());
    return symbol?.imageUrl || null;
  };


  return (
    <>
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex items-center justify-between">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Adopt a Character</h2>
        {user && (
          <button
            onClick={openCreateModal}
            className="text-xs text-white/70 hover:text-white"
          >
            + Create Adoptable
          </button>
        )}
      </div>
      <div className="px-6 py-6">
        {/* How to Adopt Section */}
        <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">How to Adopt</h3>
        
        <div className="text-xs text-gray-800 mb-6 max-w-2xl">
          <p className="mb-3"><strong>If you have an existing character on Horizon:</strong></p>
          <ul className="list-disc list-outside ml-5 space-y-3 mb-4">
            <li>Using one of your existing accounts, PM a roleplay sample of the character you are applying for to the contact listed on the adoptable</li>
            <li>If your audition is approved by the contact over PM, register as that character using the application form</li>
            <li>Post in the Joining forum using the form listed there and have the audition contact post a note approving your application</li>
            <li>If any information is left up to you, feel free to be creative when applying. You may also elaborate on/change the Brief Description if indicated by the character's owner.</li>
            <li>Once the adoption contact posts approving your application, staff will review it!</li>
          </ul>

          <p className="mb-3"><strong>If this is your first character on Horizon:</strong></p>
          <ul className="list-disc list-outside ml-5 space-y-3">
            <li>Sign up using the application form and prepend "Audition-OOCName-" to your character's first name (for example, if your name is Chels and the character is Bob, enter "Audition-Chels-Bob" into the Wolf's Name field)</li>
            <li>PM a roleplay sample for the character you are applying for to the contact listed on the adoptable</li>
            <li>If your audition is approved by the contact over PM, post in the Joining forum using the form listed there and have the audition contact post a note approving your application</li>
            <li>If any information is left up to you, feel free to be creative when applying. You may also elaborate on/change the Brief Description if indicated by the character's owner.</li>
            <li>Once the adoption contact posts approving your application, staff will review it!</li>
          </ul>
        </div>

        {/* Characters Available Section Header */}
        <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">Characters Available for Adoption</h3>

        {/* Adoptables List */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-xs">Loading adoptables...</p>
          </div>
        ) : adoptables.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 bg-gray-50">
            <p className="text-gray-600 text-sm">No adoptables available yet.</p>
            {user && (
              <p className="text-gray-500 text-sm mt-1">Be the first to add one!</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {adoptables.map(adoptable => (
              <div key={adoptable.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                {/* Character Name Header - Green like wiki pages */}
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="text-lg font-normal"
                    style={{ 
                      color: '#6c6e29', 
                      fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, sans-serif' 
                    }}
                  >
                    {adoptable.characterName}
                  </h3>
                  {canEdit(adoptable) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(adoptable)}
                        className="text-[#2f3a2f] hover:text-[#4a5d4a] text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(adoptable)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Image on left, Table on right - stacks on mobile */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Character Image */}
                  <div className="flex-shrink-0 w-full md:w-[30%]">
                    {adoptable.imageUrl ? (
                      <img
                        src={adoptable.imageUrl}
                        alt={adoptable.characterName}
                        className="w-full object-cover border border-gray-300"
                        style={{ aspectRatio: '16/9' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center ${adoptable.imageUrl ? 'hidden' : ''}`}
                      style={{ aspectRatio: '16/9' }}
                    >
                      <img 
                        src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                        alt="Placeholder" 
                        className="w-12 h-12 opacity-40"
                      />
                    </div>
                  </div>

                  {/* Details Table - 2 columns on mobile, 4 columns on desktop */}
                  <div className="flex-grow">
                    <table className="w-full text-xs border border-gray-300">
                      <tbody>
                        {/* Row 1: Sex */}
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300 w-24">Sex</td>
                          <td className="py-2 px-3 text-gray-800 md:border-r md:border-gray-300">{adoptable.sex}</td>
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300 w-24 hidden md:table-cell">Birthplace</td>
                          <td className="py-2 px-3 text-gray-800 hidden md:table-cell">{adoptable.birthplace || '—'}</td>
                        </tr>
                        {/* Row 1b: Birthplace (mobile only) */}
                        <tr className="border-b border-gray-300 md:hidden">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Birthplace</td>
                          <td className="py-2 px-3 text-gray-800">{adoptable.birthplace || '—'}</td>
                        </tr>
                        {/* Row 2: Age */}
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Age</td>
                          <td className="py-2 px-3 text-gray-800 md:border-r md:border-gray-300">{formatAge(adoptable.ageYears, adoptable.ageMonths)}</td>
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300 hidden md:table-cell">Parents</td>
                          <td className="py-2 px-3 text-gray-800 hidden md:table-cell">{adoptable.parents || '—'}</td>
                        </tr>
                        {/* Row 2b: Parents (mobile only) */}
                        <tr className="border-b border-gray-300 md:hidden">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Parents</td>
                          <td className="py-2 px-3 text-gray-800">{adoptable.parents || '—'}</td>
                        </tr>
                        {/* Row 3: Size & Build */}
                        <tr className="border-b border-gray-300">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Size & Build</td>
                          <td className="py-2 px-3 text-gray-800 md:border-r md:border-gray-300">
                            {[adoptable.height, adoptable.build].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300 hidden md:table-cell">Spirit Symbol</td>
                          <td className="py-2 px-3 text-gray-800 hidden md:table-cell">
                            {adoptable.spiritSymbol ? (
                              <span className="flex items-center gap-1">
                                {getSpiritSymbolImage(adoptable.spiritSymbol) && (
                                  <img
                                    src={getSpiritSymbolImage(adoptable.spiritSymbol)!}
                                    alt={adoptable.spiritSymbol}
                                    className="w-4 h-4"
                                  />
                                )}
                                {adoptable.spiritSymbol}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                        {/* Row 3b: Spirit Symbol (mobile only) */}
                        <tr className="border-b border-gray-300 md:hidden">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Spirit Symbol</td>
                          <td className="py-2 px-3 text-gray-800">
                            {adoptable.spiritSymbol ? (
                              <span className="flex items-center gap-1">
                                {getSpiritSymbolImage(adoptable.spiritSymbol) && (
                                  <img
                                    src={getSpiritSymbolImage(adoptable.spiritSymbol)!}
                                    alt={adoptable.spiritSymbol}
                                    className="w-4 h-4"
                                  />
                                )}
                                {adoptable.spiritSymbol}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                        {/* Row 4: Coloration */}
                        <tr className="border-b border-gray-300 md:border-b-0">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Coloration</td>
                          <td className="py-2 px-3 md:border-r md:border-gray-300">
                            {(adoptable.coatColor1 || adoptable.coatColor2 || adoptable.coatColor3 || adoptable.coatColor4 || adoptable.eyeColor) ? (
                              <div className="flex gap-1 flex-wrap">
                                {adoptable.coatColor1 && (
                                  <div 
                                    className="w-5 h-5 rounded border border-gray-400 cursor-help relative group" 
                                    style={{ backgroundColor: adoptable.coatColor1 }}
                                  >
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Coat</span>
                                  </div>
                                )}
                                {adoptable.coatColor2 && (
                                  <div 
                                    className="w-5 h-5 rounded border border-gray-400 cursor-help relative group" 
                                    style={{ backgroundColor: adoptable.coatColor2 }}
                                  >
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Coat</span>
                                  </div>
                                )}
                                {adoptable.coatColor3 && (
                                  <div 
                                    className="w-5 h-5 rounded border border-gray-400 cursor-help relative group" 
                                    style={{ backgroundColor: adoptable.coatColor3 }}
                                  >
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Coat</span>
                                  </div>
                                )}
                                {adoptable.coatColor4 && (
                                  <div 
                                    className="w-5 h-5 rounded border border-gray-400 cursor-help relative group" 
                                    style={{ backgroundColor: adoptable.coatColor4 }}
                                  >
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Coat</span>
                                  </div>
                                )}
                                {adoptable.eyeColor && (
                                  <div 
                                    className="w-5 h-5 rounded border border-gray-400 cursor-help relative group" 
                                    style={{ backgroundColor: adoptable.eyeColor }}
                                  >
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Eyes</span>
                                  </div>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300 hidden md:table-cell">Siblings</td>
                          <td className="py-2 px-3 text-gray-800 hidden md:table-cell">{adoptable.siblings || '—'}</td>
                        </tr>
                        {/* Row 4b: Siblings (mobile only) */}
                        <tr className="md:hidden">
                          <td className="py-2 px-3 font-semibold text-gray-600 uppercase text-[10px] bg-gray-100 border-r border-gray-300">Siblings</td>
                          <td className="py-2 px-3 text-gray-800">{adoptable.siblings || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Character Info - Rich text description below */}
                {adoptable.characterInfo && (
                  <div
                    className="mt-4 wiki-content max-w-none text-gray-700 text-sm"
                    dangerouslySetInnerHTML={{ __html: adoptable.characterInfo }}
                  />
                )}

                {/* Contact */}
                <div className="mt-4 text-xs text-gray-600">
                  Contact for more info: <span className="font-semibold text-[#2f3a2f]">{adoptable.createdByUsername}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* Modal - outside section for proper z-index */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white border border-gray-300 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="bg-[#2f3a2f] px-4 py-2 flex items-center justify-between sticky top-0">
            <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
              {editingAdoptable ? 'Edit Adoptable' : 'Create Adoptable'}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-[#fff9] hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Character Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Character Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.characterName}
                  onChange={e => setFormData(prev => ({ ...prev, characterName: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image
                    </label>
                    <div className="flex items-start space-x-4">
                      <div className="w-32 flex-shrink-0">
                        {(imagePreview || formData.imageUrl) ? (
                          <img
                            src={imagePreview || formData.imageUrl}
                            alt="Preview"
                            className="w-full object-cover border border-gray-300"
                            style={{ aspectRatio: '1/1' }}
                          />
                        ) : (
                          <div
                            className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center"
                            style={{ aspectRatio: '1/1' }}
                          >
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                        />
                        {isUploading && <span className="text-xs text-gray-500">Uploading...</span>}
                        <p className="text-xs text-gray-500">Max file size: 1MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.sex}
                      onChange={e => setFormData(prev => ({ ...prev, sex: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age (Years)
                      </label>
                      <select
                        value={formData.ageYears}
                        onChange={e => setFormData(prev => ({ ...prev, ageYears: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                      >
                        {[...Array(16)].map((_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age (Months)
                      </label>
                      <select
                        value={formData.ageMonths}
                        onChange={e => setFormData(prev => ({ ...prev, ageMonths: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Birthplace */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birthplace
                    </label>
                    <input
                      type="text"
                      value={formData.birthplace}
                      onChange={e => setFormData(prev => ({ ...prev, birthplace: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Parents */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parents
                    </label>
                    <input
                      type="text"
                      value={formData.parents}
                      onChange={e => setFormData(prev => ({ ...prev, parents: e.target.value }))}
                      placeholder="e.g., Father Name x Mother Name"
                      className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Siblings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Siblings
                    </label>
                    <input
                      type="text"
                      value={formData.siblings}
                      onChange={e => setFormData(prev => ({ ...prev, siblings: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Height & Build */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height
                      </label>
                      <select
                        value={formData.heightId || ''}
                        onChange={e => setFormData(prev => ({ ...prev, heightId: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                      >
                        <option value="">Select...</option>
                        {heights.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Build
                      </label>
                      <select
                        value={formData.buildId || ''}
                        onChange={e => setFormData(prev => ({ ...prev, buildId: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                      >
                        <option value="">Select...</option>
                        {builds.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Spirit Symbol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spirit Symbol
                    </label>
                    <select
                      value={formData.spiritSymbol}
                      onChange={e => setFormData(prev => ({ ...prev, spiritSymbol: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                    >
                      <option value="">Select...</option>
                      {spiritSymbols.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colors
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Coat Colors */}
                      <span className="text-xs text-gray-500">Coat:</span>
                      {[1, 2, 3, 4].map(num => (
                        <div key={num} className="flex items-center gap-1">
                          <input
                            type="color"
                            value={formData[`coatColor${num}` as keyof AdoptableFormData] as string}
                            onChange={e => setFormData(prev => ({ ...prev, [`coatColor${num}`]: e.target.value }))}
                            className="w-6 h-6 cursor-pointer border border-gray-300"
                          />
                          <input
                            type="text"
                            value={formData[`coatColor${num}` as keyof AdoptableFormData] as string}
                            onChange={e => setFormData(prev => ({ ...prev, [`coatColor${num}`]: e.target.value }))}
                            className="w-16 text-xs px-1 py-0.5 border border-gray-300 text-gray-800"
                          />
                        </div>
                      ))}
                      {/* Eye Color */}
                      <span className="text-xs text-gray-500 ml-2">Eye:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={formData.eyeColor}
                          onChange={e => setFormData(prev => ({ ...prev, eyeColor: e.target.value }))}
                          className="w-6 h-6 cursor-pointer border border-gray-300"
                        />
                        <input
                          type="text"
                          value={formData.eyeColor}
                          onChange={e => setFormData(prev => ({ ...prev, eyeColor: e.target.value }))}
                          className="w-16 text-xs px-1 py-0.5 border border-gray-300 text-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Character Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Character Info
                    </label>
                    <RichTextEditor
                      value={formData.characterInfo}
                      onChange={(value) => setFormData(prev => ({ ...prev, characterInfo: value }))}
                      placeholder="We recommend including Appearance and Personality sections. Use H2 for section headers."
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={async () => {
                        if (!user) {
                          alert('You must be logged in');
                          return;
                        }
                        
                        setIsSaving(true);
                        try {
                          const payload = {
                            characterName: formData.characterName,
                            imageUrl: formData.imageUrl || null,
                            sex: formData.sex,
                            birthplace: formData.birthplace || null,
                            ageYears: formData.ageYears,
                            ageMonths: formData.ageMonths,
                            parents: formData.parents || null,
                            heightId: formData.heightId,
                            buildId: formData.buildId,
                            spiritSymbol: formData.spiritSymbol || null,
                            coatColor1: formData.coatColor1 || null,
                            coatColor2: formData.coatColor2 || null,
                            coatColor3: formData.coatColor3 || null,
                            coatColor4: formData.coatColor4 || null,
                            eyeColor: formData.eyeColor || null,
                            siblings: formData.siblings || null,
                            characterInfo: formData.characterInfo || null,
                            createdByUserId: user.id,
                            requestingUserId: user.id,
                            isModerator: user.isModerator || user.isAdmin,
                          };
                          
                          const url = editingAdoptable ? `/api/adoptables/${editingAdoptable.id}` : '/api/adoptables';
                          const method = editingAdoptable ? 'PUT' : 'POST';
                          const response = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          });
                          if (response.ok) {
                            setIsModalOpen(false);
                            setImagePreview(null);
                            fetchAdoptables();
                          } else {
                            const errorText = await response.text();
                            alert(`Failed to save: ${errorText || response.statusText}`);
                          }
                        } catch (error) {
                          alert('Failed to save adoptable. Please try again.');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="px-4 py-2 bg-[#2f3a2f] hover:bg-[#3d4a3d] text-white text-sm font-medium disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : (editingAdoptable ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default Adopt;
