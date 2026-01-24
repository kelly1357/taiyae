import React, { useState } from 'react';

interface PingStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  currentPageUrl: string;
  isLoggedIn: boolean;
}

const PingStaffModal: React.FC<PingStaffModalProps> = ({ isOpen, onClose, userId, currentPageUrl, isLoggedIn }) => {
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/staff-pings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          isAnonymous,
          message: message.trim(),
          pageUrl: currentPageUrl
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setMessage('');
        setIsAnonymous(false);
        // Auto close after 2 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError('Failed to send ping. Please try again.');
      }
    } catch (err) {
      setError('Failed to send ping. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setIsAnonymous(false);
    setError(null);
    setSubmitSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div 
        className="bg-white w-full max-w-md mx-4 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#294023] px-4 py-3 flex justify-between items-center">
          <h2 className="text-white font-semibold">Ping Staff</h2>
          <button 
            onClick={handleClose}
            className="text-white/70 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isLoggedIn ? (
            <div className="text-center py-6">
              <div className="text-amber-500 text-4xl mb-3">🔒</div>
              <p className="text-gray-700 font-medium mb-2">Login Required</p>
              <p className="text-gray-500 text-sm">Please log in or create an account to send a message to staff.</p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Close
              </button>
            </div>
          ) : submitSuccess ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-4xl mb-3">✓</div>
              <p className="text-gray-700 font-medium">Your message has been sent!</p>
              <p className="text-gray-500 text-sm mt-1">Staff will review it as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-gray-600 mb-4">
                Send a message to the staff team. We'll review it and get back to you as soon as possible.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#294023] focus:border-transparent resize-none"
                  rows={5}
                  placeholder="Describe your issue or question..."
                  maxLength={2000}
                />
                <div className="text-xs text-gray-400 text-right mt-1">
                  {message.length}/2000
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-[#294023] border-gray-300 rounded focus:ring-[#294023]"
                  />
                  <span className="text-sm text-gray-700">Send anonymously</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {isAnonymous 
                    ? "Your username will not be visible to staff." 
                    : "Staff will see your username when reviewing this message."}
                </p>
              </div>

              <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 border border-gray-200">
                <strong>Page:</strong> {currentPageUrl}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Ping'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PingStaffModal;
