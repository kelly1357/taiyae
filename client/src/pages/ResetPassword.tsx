import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validatePassword = (pw: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validatePassword(password)) {
      setStatus('error');
      setMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
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

  if (!token) {
    return (
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Reset Password</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-800 mb-4">No reset token provided.</p>
          <Link to="/forgot-password" className="text-sm text-[#617eb3] hover:text-[#4b6596] underline">
            Request a new reset link
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Reset Password</h2>
      </div>
      <div className="px-6 py-8">
        {status === 'success' ? (
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-800 mb-4">{message}</p>
            <Link to="/" className="text-sm text-[#617eb3] hover:text-[#4b6596] underline">
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-4">
              Enter your new password below.
            </p>

            {status === 'error' && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded mb-4">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-black focus:ring-1 focus:ring-[#2f3a2f] focus:border-[#2f3a2f]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-black focus:ring-1 focus:ring-[#2f3a2f] focus:border-[#2f3a2f]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#2f3a2f] hover:bg-[#3a4a3a] text-white py-2 text-sm font-medium disabled:opacity-50"
              >
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
