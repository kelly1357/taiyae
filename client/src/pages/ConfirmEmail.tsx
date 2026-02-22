import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    fetch(`/api/confirm-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else if (data.expired) {
          setStatus('expired');
          setMessage(data.error);
          if (data.email) setEmail(data.email);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      });
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMessage(data.message || 'A new verification email has been sent.');
    } catch {
      setResendMessage('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="bg-white border border-gray-300 shadow max-w-lg mx-auto mt-8">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Email Verification</h2>
      </div>
      <div className="px-6 py-8 text-center">
        {status === 'loading' && (
          <p className="text-sm text-gray-600">Verifying your email...</p>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4">
              <svg className="w-12 h-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-800 mb-4">{message}</p>
            <p className="text-sm text-gray-600">
              You can now{' '}
              <Link to="/" className="text-[#617eb3] hover:text-[#4b6596] underline">
                sign in
              </Link>{' '}
              to your account.
            </p>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="mb-4">
              <svg className="w-12 h-12 text-amber-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-800 mb-4">{message}</p>
            {email && (
              <div className="mt-4">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="px-4 py-2 bg-[#2f3a2f] text-white text-sm hover:bg-[#3a4a3a] disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                {resendMessage && (
                  <p className="text-xs text-gray-600 mt-2">{resendMessage}</p>
                )}
              </div>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4">
              <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-800 mb-4">{message}</p>
            <p className="text-sm text-gray-600">
              <Link to="/" className="text-[#617eb3] hover:text-[#4b6596] underline">
                Return to homepage
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default ConfirmEmail;
