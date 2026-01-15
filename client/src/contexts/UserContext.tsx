
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';

// NoUser context for unauthenticated/guest users
interface NoUserContextType {
  isGuest: boolean;
}

const NoUserContext = createContext<NoUserContextType | undefined>(undefined);

export const NoUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always guest if used
  const value: NoUserContextType = { isGuest: true };
  return <NoUserContext.Provider value={value}>{children}</NoUserContext.Provider>;
};

export const useNoUser = (): NoUserContextType => {
  const context = useContext(NoUserContext);
  if (context === undefined) {
    throw new Error('useNoUser must be used within a NoUserProvider');
  }
  return context;
};

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isModerator: boolean;
  isAdmin: boolean;
  isMember: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user ID from localStorage (set at login)
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser?.id || parsedUser?.UserID;
      if (!userId) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();

      // Determine role based on Is_Moderator and Is_Admin columns from User table
      const isModerator = userData.Is_Moderator === true || userData.Is_Moderator === 1;
      const isAdmin = userData.Is_Admin === true || userData.Is_Admin === 1;
      const role: UserRole = isAdmin ? ('admin' as UserRole) : isModerator ? ('moderator' as UserRole) : ('member' as UserRole);

      // Extend User type locally to allow role property
      type UserWithRole = User & { role: UserRole };
      const userWithRole: UserWithRole = {
        ...userData,
        id: userData.UserID, // Map UserID to id for consistency
        username: userData.Username,
        email: userData.Email,
        imageUrl: userData.ImageURL,
        playerInfo: userData.Description,
        facebook: userData.Facebook,
        instagram: userData.Instagram,
        discord: userData.Discord,
        isModerator,
        isAdmin,
        role,
      };
      setUser(userWithRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: UserContextType = {
    user,
    loading,
    error,
    isModerator: user?.isModerator ?? false,
    isAdmin: user?.isAdmin ?? false,
    isMember: user !== null && !user.isModerator,
    refetchUser: fetchUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Helper hook for checking moderator status
export const useIsModerator = (): boolean => {
  const { isModerator } = useUser();
  return isModerator;
};

// Helper hook for requiring moderator access
export const useRequireModerator = (): { isModerator: boolean; loading: boolean } => {
  const { isModerator, loading } = useUser();
  return { isModerator, loading };
};

// Helper hook for checking admin status
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useUser();
  return isAdmin;
};

// Helper hook for requiring admin access
export const useRequireAdmin = (): { isAdmin: boolean; loading: boolean } => {
  const { isAdmin, loading } = useUser();
  return { isAdmin, loading };
};

export default UserContext;
