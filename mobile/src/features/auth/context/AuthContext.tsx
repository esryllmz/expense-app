import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokenStorage } from '../../../core/storage/tokenStorage';
import type { User } from '../types/authTypes';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredSession = async () => {
    try {
      const storedUser = await tokenStorage.getUser();
      const accessToken = await tokenStorage.getAccessToken();

      if (storedUser && accessToken) {
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredSession();
  }, []);

  const signIn = async (nextUser: User) => {
    setUser(nextUser);
  };

  const signOut = async () => {
    await tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return context;
};