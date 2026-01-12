import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

export default function BulletinAdmin() {
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get user ID
  const userId = (user as any)?.UserID || user?.id;
  const isModerator = user?.isModerator || user?.isAdmin;

  useEffect(() => {
    loadBulletin();
  }, []);

  async function loadBulletin() {
    try {
      const res = await fetch('/api/bulletin');
      if (res.ok) {
        const data = await res.json();
        setContent(data.Content || '');
        setIsEnabled(data.IsEnabled || false);
      }
    } catch (error) {
      console.error('Error loading bulletin:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/bulletin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          isEnabled,
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
      setSaving(false);
    }
  }

  // Check if user is moderator or admin
  if (!isModerator) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Bulletin Management</h2>
        </div>
        <div className="p-6 text-center text-gray-600">
          You do not have permission to view this page.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Bulletin Management</h2>
        </div>
        <div className="p-6 text-center text-gray-500">Loading...</div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">Bulletin Management</h2>
      </div>

      <div className="p-4">
        {message && (
          <div className={`mb-4 p-3 border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right text-xl leading-none">&times;</button>
          </div>
        )}

        {/* Enable/Disable Toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm font-semibold text-gray-700">
              {isEnabled ? 'Bulletin is ENABLED (visible on home page)' : 'Bulletin is DISABLED (hidden from home page)'}
            </span>
          </label>
        </div>

        {/* Content Editor */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Bulletin Content (HTML supported)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono"
            rows={8}
            placeholder="Enter bulletin content here. HTML tags are supported (e.g., <b>, <i>, <a href='...'>, etc.)"
          />
        </div>

        {/* Preview */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Preview
          </label>
          <div className="border border-gray-300 bg-[#4a5f4a] px-4 py-3">
            {content ? (
              <div 
                className="text-white text-sm"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <span className="text-white/50 text-sm italic">No content to preview</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Bulletin'}
          </button>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
