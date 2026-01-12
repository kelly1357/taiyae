import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

interface WikiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  userId?: number;
}

const WikiEditModal: React.FC<WikiEditModalProps> = ({ isOpen, onClose, slug, title, userId }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen) {
      fetchContent();
    }
  }, [isOpen, slug]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wiki/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.Content || '');
      } else {
        setContent('');
      }
    } catch (error) {
      console.error('Error fetching wiki content:', error);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/wiki/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          userId
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Saved! Reload the page to see changes.' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save.' });
      }
    } catch (error) {
      console.error('Error saving wiki page:', error);
      setMessage({ type: 'error', text: 'Error saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="bg-[#2f3a2f] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Edit: {title}</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {message.text && (
            <div className={`mb-4 px-4 py-2 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Edit the HTML content below. Leave empty to use the default static content.
              </p>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Enter wiki page content (HTML)..."
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 px-4 py-3 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WikiEditModal;
