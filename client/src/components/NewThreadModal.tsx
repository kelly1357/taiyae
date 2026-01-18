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
  const [subheader, setSubheader] = useState('');
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
          subheader: subheader.trim() || null,
          content,
          authorId,
        }),
      });

      if (response.ok) {
        setTitle('');
        setSubheader('');
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
      <div className="bg-white shadow w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-300">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
            Post New Thread in {regionName}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#fff9] hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="thread-title" className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
                Thread Title
              </label>
              <input
                id="thread-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Enter a descriptive title..."
                required
              />
            </div>

            <div>
              <label htmlFor="thread-subheader" className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
                Subheader <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="thread-subheader"
                type="text"
                value={subheader}
                onChange={(e) => setSubheader(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Brief description shown under the title..."
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
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

        <div className="px-4 py-3 border-t border-gray-300 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-wide shadow transition-colors ${
              isSubmitting || !title.trim() || !content.trim()
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-800 hover:bg-gray-700'
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
