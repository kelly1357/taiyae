import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface UserManagementProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [playerInfo, setPlayerInfo] = useState(user.playerInfo || '');
  const [facebook, setFacebook] = useState(user.facebook || '');
  const [instagram, setInstagram] = useState(user.instagram || '');
  const [discord, setDiscord] = useState(user.discord || '');
  const [imageUrl, setImageUrl] = useState(user.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordEditMode, setIsPasswordEditMode] = useState(false);

  useEffect(() => {
    setUsername(user.username);
    setPlayerInfo(user.playerInfo || '');
    setFacebook(user.facebook || '');
    setInstagram(user.instagram || '');
    setDiscord(user.discord || '');
    setImageUrl(user.imageUrl || '');
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
            'X-Authorization': `Bearer ${token}`
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
            playerInfo: data.user.Description || data.user.playerInfo || '',
            facebook: data.user.Facebook || data.user.facebook || '',
            instagram: data.user.Instagram || data.user.instagram || '',
            discord: data.user.Discord || data.user.discord || '',
            imageUrl: data.user.ImageURL || data.user.imageUrl || '',
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserData({ username, playerInfo, facebook, instagram, discord, imageUrl });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });
      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.url);
      } else {
        const errorText = await response.text();
        alert(`Image upload failed: ${errorText}`);
      }
    } catch (error) {
      alert(`Image upload failed: ${error}`);
    } finally {
      setUploading(false);
    }
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

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Avatar Image</label>
            <div className="flex items-start space-x-4">
              <div className="w-64 flex-shrink-0">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="User Avatar" 
                    className="w-full object-cover border border-gray-300"
                    style={{ aspectRatio: '16/9' }}
                  />
                ) : (
                  <div 
                    className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center"
                    style={{ aspectRatio: '16/9' }}
                  >
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
                <p className="text-xs text-gray-500">Max file size: 1MB.</p>
              </div>
            </div>
          </div>
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Username</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f]"
                required
            />
          </div>

          <div className="border-t border-gray-300 pt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Player Information</label>
            <textarea
              value={playerInfo}
              onChange={(e) => setPlayerInfo(e.target.value)}
              className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f] h-32"
              placeholder="Tell others about yourself..."
            />
          </div>

          <div className="border-t border-gray-300 pt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-3">Social Media</label>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f]"
                placeholder="Facebook URL"
              />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f]"
                placeholder="Instagram URL"
              />
              <input
                type="text"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#2f3a2f]"
                placeholder="Discord Username"
              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2f3a2f] hover:bg-[#3d4a3d] text-white px-4 py-2 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

          {user.authProvider === 'email' && (
            <div className="border-t border-gray-300 pt-6 mt-6">
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
    </section>
  );
};

export default UserManagement;
