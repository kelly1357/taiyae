import React, { useEffect, useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { User } from '../types';

interface PendingUser {
  UserID: number;
  Username: string;
  Email: string;
  Created: string;
  AuthProvider: string;
  ImageURL: string | null;
  UserStatus: string;
}

interface UserWithStatus {
  id: number;
  username: string;
  email: string;
  imageUrl?: string;
  isModerator: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  userStatusId: number;
  createdAt: string;
  characterCount: number;
  activeCharacterCount: number;
}

interface LayoutContext {
  user?: User;
}

type UserSortField = 'username' | 'isModerator' | 'isAdmin' | 'isBanned' | 'characterCount';
type SortDirection = 'asc' | 'desc';
type TabType = 'approvals' | 'admin';

const UserApprovalsAdmin: React.FC = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('approvals');
  const [userSortField, setUserSortField] = useState<UserSortField>('username');
  const [userSortDirection, setUserSortDirection] = useState<SortDirection>('asc');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isModerator = user?.isModerator || user?.isAdmin;
  const isAdmin = user?.isAdmin;

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/user-approval');
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/moderation/user-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to fetch users' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Fetch users when admin tab is selected
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin && allUsers.length === 0) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const handleUpdatePermissions = async (targetUserId: number, field: 'isModerator' | 'isAdmin', value: boolean) => {
    setProcessingUserId(targetUserId);
    try {
      const response = await fetch(`/api/moderation/user-permissions/${targetUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          [field]: value
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: result.message });
        setAllUsers(prev => prev.map(u =>
          u.id === targetUserId ? { ...u, [field]: value } : u
        ));
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to update permissions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update permissions' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleBanUser = async (targetUserId: number, username: string) => {
    if (!confirm(`Are you sure you want to ban "${username}"? They will no longer be able to log in.`)) {
      return;
    }

    setProcessingUserId(targetUserId);
    try {
      const response = await fetch(`/api/user-approval/ban/${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${username} has been banned.` });
        setAllUsers(prev => prev.map(u =>
          u.id === targetUserId ? { ...u, isBanned: true, userStatusId: 3 } : u
        ));
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to ban user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to ban user' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleUnbanUser = async (targetUserId: number, username: string) => {
    if (!confirm(`Are you sure you want to unban "${username}"? They will be able to log in again.`)) {
      return;
    }

    setProcessingUserId(targetUserId);
    try {
      const response = await fetch(`/api/user-approval/unban/${targetUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${username} has been unbanned.` });
        setAllUsers(prev => prev.map(u =>
          u.id === targetUserId ? { ...u, isBanned: false, userStatusId: 2 } : u
        ));
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to unban user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unban user' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleApprove = async (userId: number) => {
    setProcessingId(userId);
    try {
      const response = await fetch('/api/user-approval/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        fetchPendingUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to reject and ban "${username}"? This will prevent them from accessing the site.`)) {
      return;
    }

    setProcessingId(userId);
    try {
      const response = await fetch(`/api/user-approval/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPendingUsers();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Sort and filter users for admin tab
  const sortedUsers = useMemo(() => {
    let filtered = allUsers;
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().startsWith(query) ||
        (u.email || '').toLowerCase().startsWith(query)
      );
    }
    return [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (userSortField) {
        case 'username':
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          break;
        case 'isModerator':
          aVal = a.isModerator ? 1 : 0;
          bVal = b.isModerator ? 1 : 0;
          break;
        case 'isAdmin':
          aVal = a.isAdmin ? 1 : 0;
          bVal = b.isAdmin ? 1 : 0;
          break;
        case 'isBanned':
          aVal = a.isBanned ? 1 : 0;
          bVal = b.isBanned ? 1 : 0;
          break;
        case 'characterCount':
          aVal = a.characterCount;
          bVal = b.characterCount;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return userSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allUsers, userSortField, userSortDirection, userSearchQuery]);

  const handleUserSort = (field: UserSortField) => {
    if (userSortField === field) {
      setUserSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDirection('asc');
    }
  };

  if (!isModerator) {
    return (
      <div className="bg-white border border-gray-300 shadow p-8 text-center">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">User Management</h2>
        </div>

        <div className="p-4">
          {message && (
            <div className={`p-3 border text-sm mb-4 ${
              message.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-green-50 border-green-300 text-green-800'
            }`}>
              {message.text}
              <button
                onClick={() => setMessage(null)}
                className="float-right font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Search Bar */}
          {activeTab === 'admin' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
              />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex flex-wrap border-b border-gray-300 bg-gray-200 md:w-fit">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium ${
                activeTab === 'approvals'
                  ? 'border-b-2 border-[#2f3a2f] text-[#2f3a2f] bg-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">User Approvals</span>
              <span className="sm:hidden">Approvals</span>
              {pendingUsers.length > 0 && (
                <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium ${
                  activeTab === 'admin'
                    ? 'border-b-2 border-[#2f3a2f] text-[#2f3a2f] bg-white -mb-px'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">Administrator Status</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>

          {/* User Approvals Tab */}
          {activeTab === 'approvals' && (
            <div className="mt-4">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : pendingUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending user approvals!</p>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(pendingUser => (
                    <div key={pendingUser.UserID} className="border border-blue-200 bg-blue-50">
                      <div className="px-4 py-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {pendingUser.ImageURL ? (
                              <img
                                src={pendingUser.ImageURL}
                                alt={pendingUser.Username}
                                className="w-10 h-10 object-cover border border-gray-300"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 border border-gray-300 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{pendingUser.Username}</div>
                              <div className="text-xs text-gray-500">{pendingUser.Email}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApprove(pendingUser.UserID)}
                              disabled={processingId === pendingUser.UserID}
                              className="text-xs px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {processingId === pendingUser.UserID ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(pendingUser.UserID, pendingUser.Username)}
                              disabled={processingId === pendingUser.UserID}
                              className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-500 flex gap-4">
                          <div>
                            <span className="font-medium">Registered: </span>
                            {formatDate(pendingUser.Created)}
                          </div>
                          <div>
                            <span className="font-medium">Auth: </span>
                            {pendingUser.AuthProvider === 'google' ? 'Google' : 'Email'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Administrator Status Tab - Admin only */}
          {activeTab === 'admin' && isAdmin && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-4">
                Manage administrator and moderator permissions for all users.
                <span className="text-red-600 font-medium"> Changes take effect immediately.</span>
              </p>

              {usersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : sortedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found.
                </div>
              ) : (
                <div className="border border-gray-300">
                  {/* Mobile Sort Options */}
                  <div className="md:hidden bg-gray-200 px-3 py-2 flex items-center gap-2 text-xs">
                    <span className="text-gray-600">Sort by:</span>
                    <select
                      value={userSortField}
                      onChange={(e) => setUserSortField(e.target.value as UserSortField)}
                      className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                    >
                      <option value="username">Username</option>
                      <option value="characterCount">Characters</option>
                      <option value="isModerator">Moderator</option>
                      <option value="isAdmin">Admin</option>
                      <option value="isBanned">Banned</option>
                    </select>
                    <button
                      onClick={() => setUserSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                      className="bg-white border border-gray-300 px-2 py-1 text-gray-700"
                    >
                      {userSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                  </div>

                  {/* Desktop Table View */}
                  <table className="hidden md:table w-full text-sm">
                    <thead>
                      <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                        <th
                          className={`px-3 py-2 border-r border-gray-300 cursor-pointer hover:bg-gray-300 text-left ${userSortField === 'username' ? 'bg-gray-300' : ''}`}
                          onClick={() => handleUserSort('username')}
                        >
                          User
                        </th>
                        <th className="px-3 py-2 border-r border-gray-300 text-left">Email</th>
                        <th
                          className={`px-3 py-2 border-r border-gray-300 cursor-pointer hover:bg-gray-300 text-center w-28 ${userSortField === 'characterCount' ? 'bg-gray-300' : ''}`}
                          onClick={() => handleUserSort('characterCount')}
                        >
                          Characters
                        </th>
                        <th
                          className={`px-3 py-2 border-r border-gray-300 cursor-pointer hover:bg-gray-300 text-center w-28 ${userSortField === 'isModerator' ? 'bg-gray-300' : ''}`}
                          onClick={() => handleUserSort('isModerator')}
                        >
                          Moderator
                        </th>
                        <th
                          className={`px-3 py-2 border-r border-gray-300 cursor-pointer hover:bg-gray-300 text-center w-28 ${userSortField === 'isAdmin' ? 'bg-gray-300' : ''}`}
                          onClick={() => handleUserSort('isAdmin')}
                        >
                          Admin
                        </th>
                        <th
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-300 text-center w-28 ${userSortField === 'isBanned' ? 'bg-gray-300' : ''}`}
                          onClick={() => handleUserSort('isBanned')}
                        >
                          Banned
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map(u => (
                        <tr key={u.id} className={`border-t border-gray-300 hover:bg-gray-50 ${u.isBanned ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-3 border-r border-gray-300">
                            <div className="flex items-center gap-2">
                              {u.imageUrl ? (
                                <img src={u.imageUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <Link to={`/user/${u.id}`} className="text-[#2f3a2f] hover:underline font-medium">
                                {u.username}
                              </Link>
                              {u.id === Number(user?.id) && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">You</span>
                              )}
                              {u.isBanned && (
                                <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Banned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-300 text-gray-600">
                            {u.email}
                          </td>
                          <td className="px-3 py-3 border-r border-gray-300 text-center text-gray-600">
                            {u.activeCharacterCount}/{u.characterCount}
                          </td>
                          <td className="px-3 py-3 border-r border-gray-300 text-center">
                            <button
                              onClick={() => handleUpdatePermissions(u.id, 'isModerator', !u.isModerator)}
                              disabled={processingUserId === u.id || u.isBanned}
                              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                                u.isModerator
                                  ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                              } disabled:opacity-50`}
                            >
                              {processingUserId === u.id ? '...' : u.isModerator ? '✓ Yes' : 'No'}
                            </button>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-300 text-center">
                            <button
                              onClick={() => handleUpdatePermissions(u.id, 'isAdmin', !u.isAdmin)}
                              disabled={processingUserId === u.id || u.id === Number(user?.id) || u.isBanned}
                              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                                u.isAdmin
                                  ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={u.id === Number(user?.id) ? "You cannot remove your own admin status" : ""}
                            >
                              {processingUserId === u.id ? '...' : u.isAdmin ? '✓ Yes' : 'No'}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {u.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(u.id, u.username)}
                                disabled={processingUserId === u.id}
                                className="px-3 py-1 text-xs font-medium border bg-green-100 text-green-700 border-green-300 hover:bg-green-200 disabled:opacity-50"
                              >
                                {processingUserId === u.id ? '...' : 'Unban'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(u.id, u.username)}
                                disabled={processingUserId === u.id || u.id === Number(user?.id)}
                                className="px-3 py-1 text-xs font-medium border bg-red-100 text-red-700 border-red-300 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={u.id === Number(user?.id) ? "You cannot ban yourself" : ""}
                              >
                                {processingUserId === u.id ? '...' : 'Ban'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-gray-300">
                    {sortedUsers.map(u => (
                      <div key={u.id} className={`p-3 hover:bg-gray-50 ${u.isBanned ? 'bg-red-50' : ''}`}>
                        <div className="flex gap-3">
                          {/* User Avatar */}
                          {u.imageUrl ? (
                            <img src={u.imageUrl} alt={u.username} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg flex-shrink-0">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/user/${u.id}`} className="text-[#2f3a2f] hover:underline font-medium">
                                {u.username}
                              </Link>
                              {u.id === Number(user?.id) && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">You</span>
                              )}
                              {u.isBanned && (
                                <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Banned</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate">{u.email}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Characters: {u.activeCharacterCount}/{u.characterCount}
                            </div>

                            {/* Permission Buttons */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <button
                                onClick={() => handleUpdatePermissions(u.id, 'isModerator', !u.isModerator)}
                                disabled={processingUserId === u.id || u.isBanned}
                                className={`px-3 py-1 text-xs font-medium border transition-colors ${
                                  u.isModerator
                                    ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                } disabled:opacity-50`}
                              >
                                {processingUserId === u.id ? '...' : u.isModerator ? '✓ Mod' : 'Mod'}
                              </button>
                              <button
                                onClick={() => handleUpdatePermissions(u.id, 'isAdmin', !u.isAdmin)}
                                disabled={processingUserId === u.id || u.id === Number(user?.id) || u.isBanned}
                                className={`px-3 py-1 text-xs font-medium border transition-colors ${
                                  u.isAdmin
                                    ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {processingUserId === u.id ? '...' : u.isAdmin ? '✓ Admin' : 'Admin'}
                              </button>
                              {u.isBanned ? (
                                <button
                                  onClick={() => handleUnbanUser(u.id, u.username)}
                                  disabled={processingUserId === u.id}
                                  className="px-3 py-1 text-xs font-medium border bg-green-100 text-green-700 border-green-300 hover:bg-green-200 disabled:opacity-50"
                                >
                                  {processingUserId === u.id ? '...' : 'Unban'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBanUser(u.id, u.username)}
                                  disabled={processingUserId === u.id || u.id === Number(user?.id)}
                                  className="px-3 py-1 text-xs font-medium border bg-red-100 text-red-700 border-red-300 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingUserId === u.id ? '...' : 'Ban'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-300 shadow">
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">About User Management</h2>
        </div>
        <div className="p-4 text-sm text-gray-600 space-y-2">
          <p>
            <strong>User Approvals:</strong> New users register with a "Joining" status and cannot create characters until approved.
          </p>
          <p>
            <strong>Approve:</strong> Changes the user's status to "Joined", allowing them to create characters and participate fully.
          </p>
          <p>
            <strong>Reject:</strong> Changes the user's status to "Banned", preventing them from accessing the site.
          </p>
          {isAdmin && (
            <>
              <hr className="my-3" />
              <p>
                <strong>Administrator Status:</strong> Manage moderator and admin permissions, and ban/unban users.
              </p>
              <p>
                <strong>Ban:</strong> Prevents a user from logging in. Banned users cannot access the site.
              </p>
              <p>
                <strong>Unban:</strong> Restores a user's access to the site by changing their status back to "Joined".
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserApprovalsAdmin;
