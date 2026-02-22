import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('sent');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Forgot Password</h2>
      </div>
      <div className="px-6 py-8">
        {status === 'sent' ? (
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-800 mb-2 font-medium">Check your email</p>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <p className="text-xs text-gray-500">The reset link will expire in 1 hour.</p>
            <div className="mt-6">
              <Link to="/" className="text-sm text-[#617eb3] hover:text-[#4b6596] underline">
                Return to homepage
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {status === 'error' && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded mb-4">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-black focus:ring-1 focus:ring-[#2f3a2f] focus:border-[#2f3a2f]"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#2f3a2f] hover:bg-[#3a4a3a] text-white py-2 text-sm font-medium disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/" className="text-xs text-[#617eb3] hover:text-[#4b6596] underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ForgotPassword;
