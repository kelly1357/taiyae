import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionId?: string;
  oocForumId?: string;
  regionName: string;
  onThreadCreated: () => void;
  authorId?: number | string;
}

const NewThreadModal: React.FC<NewThreadModalProps> = ({ 
  isOpen, 
  onClose, 
  regionId,
  oocForumId,
  regionName,
  onThreadCreated,
  authorId
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    try {
      // Replace with your actual API call
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regionId,
          oocForumId,
          title,
          content,
          authorId,
        }),
      });

      if (response.ok) {
        setTitle('');
        setContent('');
        onThreadCreated();
        onClose();
      } else {
        console.error('Failed to create thread');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900">
            Post New Thread in <span className="text-blue-600">{regionName}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="thread-title" className="block text-sm font-medium text-gray-700 mb-1">
                Thread Title
              </label>
              <input
                id="thread-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a descriptive title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post content here..."
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`px-6 py-2 rounded font-bold text-white shadow transition-colors ${
              isSubmitting || !title.trim() || !content.trim()
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Post Thread'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewThreadModal;
