import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';


export default function HomepageAdmin() {
  const { user } = useUser();
  
  // Bulletin state
  const [bulletinContent, setBulletinContent] = useState('');
  const [bulletinEnabled, setBulletinEnabled] = useState(false);
  const [bulletinLoading, setBulletinLoading] = useState(true);
  const [bulletinSaving, setBulletinSaving] = useState(false);
  
  // Sitewide Updates state
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get user ID
  const userId = (user as any)?.UserID || user?.id;
  const isModerator = user?.isModerator || user?.isAdmin;

  useEffect(() => {
    loadBulletin();
    loadUpdates();
  }, []);

  async function loadBulletin() {
    try {
      const res = await fetch('/api/bulletin');
      if (res.ok) {
        const data = await res.json();
        setBulletinContent(data.Content || '');
        setBulletinEnabled(data.IsEnabled || false);
      }
    } catch (error) {
      console.error('Error loading bulletin:', error);
    } finally {
      setBulletinLoading(false);
    }
  }

  async function loadUpdates() {
    try {
      const res = await fetch('/api/sitewide-updates?limit=20');
      if (res.ok) {
         await res.json();
      }
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setUpdatesLoading(false);
    }
  }

  async function handleSaveBulletin() {
    setBulletinSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/bulletin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: bulletinContent,
          isEnabled: bulletinEnabled,
          userId
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Bulletin saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save bulletin' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving bulletin' });
    } finally {
      setBulletinSaving(false);
    }
  }

  async function handleAddUpdate() {
    if (!newUpdateContent.trim()) {
      setMessage({ type: 'error', text: 'Please enter update content' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/sitewide-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newUpdateContent,
          userId
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Update added successfully!' });
        setNewUpdateContent('');
        loadUpdates();
      } else {
        setMessage({ type: 'error', text: 'Failed to add update' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding update' });
    } finally {
      setSubmitting(false);
    }
  }


  // Check if user is moderator or admin
  if (!isModerator) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Homepage Management</h2>
        </div>
        <div className="p-6 text-center text-gray-600">
          You do not have permission to view this page.
        </div>
      </section>
    );
  }

  const loading = bulletinLoading || updatesLoading;

  if (loading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Homepage Management</h2>
        </div>
        <div className="p-6 text-center text-gray-500">Loading...</div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Homepage Management</h2>
      </div>

      <div className="p-6">
        {message && (
          <div className={`mb-4 p-3 border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right text-xl leading-none">&times;</button>
          </div>
        )}

        {/* SITEWIDE UPDATES SECTION */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          Sitewide Updates
        </h2>

        {/* Add New Update */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Add New Update (HTML supported)
          </label>
          <textarea
            value={newUpdateContent}
            onChange={(e) => setNewUpdateContent(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
            rows={4}
            placeholder="Enter update content here. HTML tags are supported."
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Only the 3 most recent updates will appear on the home page. <Link to="/sitewide-updates" className="text-gray-700 hover:underline font-bold">View All Updates</Link>
            </span>
            <button
              onClick={handleAddUpdate}
              disabled={submitting || !newUpdateContent.trim()}
              className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Update'}
            </button>
          </div>
        </div>

        {/* BULLETIN SECTION */}
        <h2 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-4">
          Bulletin
        </h2>

        {/* Enable/Disable Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={bulletinEnabled}
              onChange={(e) => setBulletinEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm font-semibold text-gray-700">
              {bulletinEnabled ? 'Bulletin is ENABLED (visible on home page)' : 'Bulletin is DISABLED (hidden from home page)'}
            </span>
          </label>
        </div>

        {/* Content Editor */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Bulletin Content (HTML supported)
          </label>
          <textarea
            value={bulletinContent}
            onChange={(e) => setBulletinContent(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono"
            rows={4}
            placeholder="Enter bulletin content here. HTML tags are supported."
          />
        </div>

        {/* Preview */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Bulletin Preview
          </label>
          <div className="border border-gray-300 bg-[#e5ebd4] px-4 py-3">
            <div className="text-gray-800 text-[13px] text-left">
              <span className="text-[#81973b]">• Bulletin—</span>{' '}
              {bulletinContent ? (
                <span 
                  className="bulletin-content"
                  dangerouslySetInnerHTML={{ __html: bulletinContent }}
                />
              ) : (
                <span className="text-gray-400 italic">No content to preview</span>
              )}
            </div>
          </div>
        </div>

        {/* Save Bulletin */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveBulletin}
            disabled={bulletinSaving}
            className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
          >
            {bulletinSaving ? 'Saving...' : 'Save Bulletin'}
          </button>
        </div>
      </div>
    </section>
  );
}
