import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionId: string;
  regionName: string;
  onThreadCreated: () => void;
}

const NewThreadModal: React.FC<NewThreadModalProps> = ({ 
  isOpen, 
  onClose, 
  regionId, 
  regionName,
  onThreadCreated 
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
          title,
          content,
          // In a real app, you'd get the current user ID from context/auth
          authorId: 1, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Post New Thread in <span className="text-blue-400">{regionName}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="thread-title" className="block text-sm font-medium text-gray-300 mb-1">
                Thread Title
              </label>
              <input
                id="thread-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter a descriptive title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
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

        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`px-6 py-2 rounded font-bold text-white ${
              isSubmitting || !title.trim() || !content.trim()
                ? 'bg-blue-800 cursor-not-allowed' 
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
