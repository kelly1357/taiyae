import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

interface Pack {
  id: number;
  name: string;
  slug: string;
  color1: string;
  color2: string;
  color1Name: string | null;
  color2Name: string | null;
  history: string | null;
  hierarchyExplanation: string | null;
  values: string | null;
  misc: string | null;
  isActive: boolean;
  foundedText: string | null;
  ranks: { id: number; name: string; displayOrder: number }[];
  subareas: { id: string; name: string }[];
  stats: {
    pupsBorn: number;
    deaths: number;
    currentMales: number;
    currentFemales: number;
    currentPups: number;
  };
}

interface Subarea {
  id: string;
  name: string;
  regionId: string;
}

const emptyPack = {
  name: '',
  color1: '#000000',
  color2: '#000000',
  color1Name: '',
  color2Name: '',
  history: '',
  hierarchyExplanation: '',
  values: '',
  misc: '',
  isActive: true,
  foundedText: '',
  ranks: [] as string[],
  subareaIds: [] as string[],
  stats: { pupsBorn: 0, deaths: 0 }
};

export default function PackAdmin() {
  const { user } = useUser();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [subareas, setSubareas] = useState<Subarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Edit modal state
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState(emptyPack);
  const [newRank, setNewRank] = useState('');
  const [saving, setSaving] = useState(false);

  const isStaff = user && (user.isModerator || user.isAdmin);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [packsRes, subareasRes] = await Promise.all([
        fetch('/api/packs'),
        fetch('/api/subareas')
      ]);
      
      const packsData = await packsRes.json();
      setPacks(packsData);
      
      if (subareasRes.ok) {
        const subareasData = await subareasRes.json();
        setSubareas(subareasData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(pack: Pack) {
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      color1: pack.color1,
      color2: pack.color2,
      color1Name: pack.color1Name || '',
      color2Name: pack.color2Name || '',
      history: pack.history || '',
      hierarchyExplanation: pack.hierarchyExplanation || '',
      values: pack.values || '',
      misc: pack.misc || '',
      isActive: pack.isActive,
      foundedText: pack.foundedText || '',
      ranks: pack.ranks.map(r => r.name),
      subareaIds: pack.subareas.map(s => s.id),
      stats: { pupsBorn: pack.stats.pupsBorn, deaths: pack.stats.deaths }
    });
    setShowCreateModal(false);
  }

  function openCreateModal() {
    setEditingPack(null);
    setFormData(emptyPack);
    setShowCreateModal(true);
  }

  function closeModal() {
    setEditingPack(null);
    setShowCreateModal(false);
    setFormData(emptyPack);
    setNewRank('');
  }

  function addRank() {
    if (newRank.trim()) {
      setFormData({ ...formData, ranks: [...formData.ranks, newRank.trim()] });
      setNewRank('');
    }
  }

  function removeRank(index: number) {
    setFormData({ ...formData, ranks: formData.ranks.filter((_, i) => i !== index) });
  }

  function moveRank(index: number, direction: 'up' | 'down') {
    const newRanks = [...formData.ranks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRanks.length) return;
    [newRanks[index], newRanks[targetIndex]] = [newRanks[targetIndex], newRanks[index]];
    setFormData({ ...formData, ranks: newRanks });
  }

  function toggleSubarea(subareaId: string) {
    if (formData.subareaIds.includes(subareaId)) {
      setFormData({ ...formData, subareaIds: formData.subareaIds.filter(id => id !== subareaId) });
    } else {
      setFormData({ ...formData, subareaIds: [...formData.subareaIds, subareaId] });
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.color1 || !formData.color2) {
      setMessage({ type: 'error', text: 'Name and colors are required' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingPack ? `/api/packs/${editingPack.id}` : '/api/packs';
      const method = editingPack ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingPack ? 'Pack updated!' : 'Pack created!' });
        closeModal();
        loadData();
      } else {
        const errorText = await res.text();
        setMessage({ type: 'error', text: errorText || 'Failed to save pack' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving pack' });
    } finally {
      setSaving(false);
    }
  }

  if (!isStaff) {
    return (
      <div className="bg-white border border-gray-300 shadow p-8 text-center">
        <p className="text-gray-600">You must be a moderator to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Pack Administration</h2>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Manage packs, ranks, and territories.</p>
            <button
              onClick={openCreateModal}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide"
            >
              Create New Pack
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Packs List */}
      <div className="bg-white border border-gray-300 shadow">
        <div className="bg-gray-200 px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">All Packs</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {packs.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm italic">No packs found.</div>
          ) : (
            packs.map(pack => (
              <div key={pack.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded-sm border border-gray-300" style={{ backgroundColor: pack.color1 }} />
                    <span className="w-4 h-4 rounded-sm border border-gray-300" style={{ backgroundColor: pack.color2 }} />
                  </div>
                  <div>
                    <Link 
                      to={`/pack/${pack.slug}`}
                      className="font-semibold hover:underline"
                      style={{
                        background: `linear-gradient(to right, ${pack.color1}, ${pack.color2})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {pack.name}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {pack.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Disbanded</span>
                      )}
                      {' • '}
                      {pack.stats.currentMales + pack.stats.currentFemales + pack.stats.currentPups} members
                      {' • '}
                      {pack.ranks.length} ranks
                      {' • '}
                      {pack.subareas.length} territories
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openEditModal(pack)}
                  className="text-xs text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 hover:bg-gray-100"
                >
                  Edit
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {(editingPack || showCreateModal) && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[100] overflow-y-auto py-8">
          <div className="bg-white border border-gray-300 shadow-lg w-full max-w-3xl mx-4">
            <div className="bg-[#2f3a2f] px-4 py-2 flex justify-between items-center">
              <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
                {editingPack ? `Edit Pack: ${editingPack.name}` : 'Create New Pack'}
              </h2>
              <button onClick={closeModal} className="text-white hover:text-gray-300 text-xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-gray-900">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pack Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g., Firewing Brotherhood"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Color 1 (Hex) *</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color1}
                      onChange={e => setFormData({ ...formData, color1: e.target.value })}
                      className="w-12 h-9 border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color1}
                      onChange={e => setFormData({ ...formData, color1: e.target.value })}
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                      placeholder="#3f7dac"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Color 1 Name</label>
                  <input
                    type="text"
                    value={formData.color1Name}
                    onChange={e => setFormData({ ...formData, color1Name: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g., Aekyr Blue"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Color 2 (Hex) *</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color2}
                      onChange={e => setFormData({ ...formData, color2: e.target.value })}
                      className="w-12 h-9 border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color2}
                      onChange={e => setFormData({ ...formData, color2: e.target.value })}
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                      placeholder="#e0662a"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Color 2 Name</label>
                  <input
                    type="text"
                    value={formData.color2Name}
                    onChange={e => setFormData({ ...formData, color2Name: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g., Brightfire Red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Founded</label>
                  <input
                    type="text"
                    value={formData.foundedText}
                    onChange={e => setFormData({ ...formData, foundedText: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g., Full Summer, HY0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'disbanded'}
                    onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="disbanded">Disbanded</option>
                  </select>
                </div>
              </div>

              {/* Color Preview */}
              <div className="bg-gray-50 p-4 border border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Color Preview</label>
                <span
                  className="text-2xl font-bold"
                  style={{
                    background: `linear-gradient(to right, ${formData.color1}, ${formData.color2})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {formData.name || 'Pack Name'}
                </span>
              </div>

              {/* History */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">History (HTML)</label>
                <textarea
                  value={formData.history}
                  onChange={e => setFormData({ ...formData, history: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm h-32"
                  placeholder="<p>Pack history goes here...</p>"
                />
              </div>

              {/* Hierarchy */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Hierarchy Explanation (HTML)</label>
                <textarea
                  value={formData.hierarchyExplanation}
                  onChange={e => setFormData({ ...formData, hierarchyExplanation: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm h-24"
                  placeholder="<p>Description of the pack's hierarchy system...</p>"
                />
              </div>

              {/* Values */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Values (HTML)</label>
                <textarea
                  value={formData.values}
                  onChange={e => setFormData({ ...formData, values: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm h-24"
                  placeholder="<p>Pack values and culture...</p>"
                />
              </div>

              {/* Ranks */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Ranks (in order)</label>
                <div className="space-y-2 mb-2">
                  {formData.ranks.map((rank, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 border border-gray-200">
                      <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                      <span className="flex-1 text-sm">{rank}</span>
                      <button
                        type="button"
                        onClick={() => moveRank(index, 'up')}
                        disabled={index === 0}
                        className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRank(index, 'down')}
                        disabled={index === formData.ranks.length - 1}
                        className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRank(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRank}
                    onChange={e => setNewRank(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRank())}
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Add a rank..."
                  />
                  <button
                    type="button"
                    onClick={addRank}
                    className="bg-gray-200 hover:bg-gray-300 px-4 py-2 text-xs font-semibold uppercase"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Territories */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Claimed Territories</label>
                <div className="grid grid-cols-2 gap-2">
                  {subareas.map(subarea => (
                    <label key={subarea.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.subareaIds.includes(subarea.id)}
                        onChange={() => toggleSubarea(subarea.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{subarea.name}</span>
                    </label>
                  ))}
                  {subareas.length === 0 && (
                    <div className="col-span-2 text-sm text-gray-500 italic">No subareas available.</div>
                  )}
                </div>
              </div>

              {/* Stats (only for editing) */}
              {editingPack && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Historical Stats</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Pups Born (lifetime)</label>
                      <input
                        type="number"
                        value={formData.stats.pupsBorn}
                        onChange={e => setFormData({ ...formData, stats: { ...formData.stats, pupsBorn: parseInt(e.target.value) || 0 } })}
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Deaths (lifetime)</label>
                      <input
                        type="number"
                        value={formData.stats.deaths}
                        onChange={e => setFormData({ ...formData, stats: { ...formData.stats, deaths: parseInt(e.target.value) || 0 } })}
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Current member counts are calculated automatically from pack membership.</p>
                </div>
              )}

              {/* Misc */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Miscellaneous Notes (HTML)</label>
                <textarea
                  value={formData.misc}
                  onChange={e => setFormData({ ...formData, misc: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm h-24"
                  placeholder="Any additional info..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold uppercase text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingPack ? 'Save Changes' : 'Create Pack')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
