import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (user: any) => void;
  compact?: boolean; // For sidebar use
}

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "24400309621-82ui432053g7jjgof13i5r4f6cfft1c1.apps.googleusercontent.com"; 

const Login: React.FC<LoginProps> = ({ onLogin, compact = false }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isBanned, setIsBanned] = useState(false);
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
    setIsBanned(false);

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
        const isModerator = data.user.Is_Moderator === true || data.user.Is_Moderator === 1 || data.user.isModerator === true;
        const isAdmin = data.user.Is_Admin === true || data.user.Is_Admin === 1 || data.user.isAdmin === true;
        const isAbsent = data.user.Is_Absent === true || data.user.Is_Absent === 1 || data.user.isAbsent === true;
        const normalizedUser = {
            id: data.user.UserID || data.user.id,
            username: data.user.Username || data.user.username,
            email: data.user.Email || data.user.email,
            authProvider: data.user.Auth_Provider || data.user.authProvider,
            playerInfo: data.user.Description || data.user.playerInfo || '',
            facebook: data.user.Facebook || data.user.facebook || '',
            instagram: data.user.Instagram || data.user.instagram || '',
            discord: data.user.Discord || data.user.discord || '',
            imageUrl: data.user.ImageURL || data.user.imageUrl || '',
            isModerator,
            isAdmin,
            isAbsent,
            absenceNote: data.user.Absence_Note || data.user.absenceNote || '',
            role: isModerator ? 'moderator' : 'member',
            userStatus: data.user.userStatus || 'Joined',
            userStatusId: data.user.userStatusId || data.user.UserStatusID || 2,
        };
        onLogin(normalizedUser);
        navigate('/');
      } else {
        console.error('Auth failed response:', data);
        if (data.error === 'banned') {
          setIsBanned(true);
          setError(data.message || 'Your account has been banned.');
        } else {
          setError(data.body || data.message || 'Authentication failed');
        }
      }
    } catch (err) {
      console.error('Auth exception:', err);
      setError('An error occurred. Please try again. ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsBanned(false);
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
        const isModerator = data.user.Is_Moderator === true || data.user.Is_Moderator === 1 || data.user.isModerator === true;
        const isAdmin = data.user.Is_Admin === true || data.user.Is_Admin === 1 || data.user.isAdmin === true;
        const isAbsent = data.user.Is_Absent === true || data.user.Is_Absent === 1 || data.user.isAbsent === true;
        const normalizedUser = {
            id: data.user.UserID || data.user.id,
            username: data.user.Username || data.user.username,
            email: data.user.Email || data.user.email,
            authProvider: data.user.Auth_Provider || data.user.authProvider,
            playerInfo: data.user.Description || data.user.playerInfo || '',
            facebook: data.user.Facebook || data.user.facebook || '',
            instagram: data.user.Instagram || data.user.instagram || '',
            discord: data.user.Discord || data.user.discord || '',
            imageUrl: data.user.ImageURL || data.user.imageUrl || '',
            isModerator,
            isAdmin,
            isAbsent,
            absenceNote: data.user.Absence_Note || data.user.absenceNote || '',
            role: isModerator ? 'moderator' : 'member',
            userStatus: data.user.userStatus || 'Joined',
            userStatusId: data.user.userStatusId || data.user.UserStatusID || 2,
        };
        onLogin(normalizedUser);
        navigate('/');
      } else {
        console.error('Google login failed response:', data);
        if (data.error === 'banned') {
          setIsBanned(true);
          setError(data.message || 'Your account has been banned.');
        } else {
          setError(data.body || data.message || 'Google login failed');
        }
      }
    } catch (err) {
      console.error('Google login exception:', err);
      setError('Google login error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Compact sidebar version
  if (compact) {
    return (
      <div className="text-gray-900">
        {error && (
          <div className={`p-2 rounded mb-3 text-xs ${
            isBanned
              ? 'bg-red-600 border border-red-700 text-white font-medium'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#2f3a2f] focus:border-[#2f3a2f]"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#2f3a2f] focus:border-[#2f3a2f]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#2f3a2f] focus:border-[#2f3a2f]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#2f3a2f] hover:bg-[#3d4a3d] text-white py-1.5 rounded text-sm font-medium"
          >
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="outline"
                size="medium"
              />
            </GoogleOAuthProvider>
          </div>
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-[#2f3a2f] hover:text-[#4a5a4a] font-medium"
          >
            {isRegistering ? 'Have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>
      </div>
    );
  }

  // Full page version
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>

        {error && (
          <div className={`p-3 rounded mb-4 text-sm ${
            isBanned
              ? 'bg-red-600 border border-red-700 text-white font-medium'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
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
