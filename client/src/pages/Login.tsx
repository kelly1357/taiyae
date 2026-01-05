import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (user: any) => void;
}

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "24400309621-82ui432053g7jjgof13i5r4f6cfft1c1.apps.googleusercontent.com"; 

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isRegistering && !validatePassword(password)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }
    
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering ? { email, password, username } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        // If not JSON, read as text (likely an error message string)
        const text = await response.text();
        data = { body: text };
      }

      if (response.ok) {
        localStorage.setItem('token', data.token);
        const normalizedUser = {
            id: data.user.UserID || data.user.id,
            username: data.user.Username || data.user.username,
            email: data.user.Email || data.user.email,
            authProvider: data.user.Auth_Provider || data.user.authProvider,
        };
        onLogin(normalizedUser);
        navigate('/');
      } else {
        console.error('Auth failed response:', data);
        setError(data.body || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth exception:', err);
      setError('An error occurred. Please try again. ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch('/api/auth-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { body: text };
      }

      if (response.ok) {
        localStorage.setItem('token', data.token);
        const normalizedUser = {
            id: data.user.UserID || data.user.id,
            username: data.user.Username || data.user.username,
            email: data.user.Email || data.user.email,
            authProvider: data.user.Auth_Provider || data.user.authProvider,
        };
        onLogin(normalizedUser);
        navigate('/');
      } else {
        console.error('Google login failed response:', data);
        setError(data.body || 'Google login failed');
      }
    } catch (err) {
      console.error('Google login exception:', err);
      setError('Google login error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {isRegistering && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special char.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium shadow"
          >
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-center">
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme="outline"
                        shape="pill"
                    />
                </GoogleOAuthProvider>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
