import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface UserManagementProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordEditMode, setIsPasswordEditMode] = useState(false);

  useEffect(() => {
    setUsername(user.username);
  }, [user]);

  const updateUserData = async (payload: any) => {
    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON (e.g. 404 from proxy/host with no body)
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
      }

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
        localStorage.setItem('token', data.token);
        
        // Normalize user data if needed, similar to Login.tsx
        const normalizedUser = {
            ...user,
            username: data.user.Username || data.user.username,
            email: data.user.Email || data.user.email,
        };
        
        onUpdateUser(normalizedUser);
        return true;
      } else {
        setMessage({ type: 'error', text: data?.body || data?.message || 'Update failed.' });
        return false;
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'An error occurred.' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserData({ username });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (!currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required to set a new password.' });
        return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        setMessage({ type: 'error', text: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
        return;
    }

    const success = await updateUserData({ 
        currentPassword, 
        newPassword 
    });

    if (success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordEditMode(false);
    }
  };

  return (
    <section className="border border-gray-300 bg-white shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h1 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Account Settings</h1>
      </div>

      <div className="px-6 py-6">
        {message.text && (
          <div className={`p-3 mb-6 border text-sm ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
          </div>

          <form onSubmit={handleUpdateUsername}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Username</label>
            <div className="space-y-2">
              <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f]"
                  required
              />
              <button
                  type="submit"
                  disabled={isLoading || username === user.username}
                  className="bg-[#2f3a2f] hover:bg-[#3d4a3d] text-white px-4 py-2 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
              >
                  {isLoading ? 'Saving...' : 'Save Username'}
              </button>
            </div>
          </form>

          {user.authProvider === 'email' && (
            <div className="border-t border-gray-300 pt-6">
              <div className="flex items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mr-2">Change Password</h3>
                  <button 
                      type="button"
                      onClick={() => setIsPasswordEditMode(!isPasswordEditMode)}
                      className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      title="Unlock password fields"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                  </button>
              </div>
              
              <form onSubmit={handleUpdatePassword} className={`space-y-4 transition-opacity duration-200 ${isPasswordEditMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={!isPasswordEditMode}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f] disabled:cursor-not-allowed"
                    placeholder="Required to set new password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={!isPasswordEditMode}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f] disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                      Must be at least 8 characters with uppercase, lowercase, number, and special char.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!isPasswordEditMode}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f] disabled:cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <button
                      type="submit"
                      disabled={isLoading || !isPasswordEditMode}
                      className="w-full bg-[#2f3a2f] hover:bg-[#3d4a3d] text-white py-2 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
                  >
                      {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserManagement;
