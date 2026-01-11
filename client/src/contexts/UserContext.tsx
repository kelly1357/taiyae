import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';

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
      
      const response = await fetch('/api/user/me', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not logged in
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user');
      }
      
      const userData = await response.json();
      
      // Determine role based on Is_Moderator column
      const isModerator = userData.isModerator === true || userData.isModerator === 1;
      const isAdmin = userData.isAdmin === true || userData.isAdmin === 1;
      const role: UserRole = isModerator ? 'moderator' : 'member';
      
      setUser({
        ...userData,
        isModerator,
        isAdmin,
        role,
      });
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
