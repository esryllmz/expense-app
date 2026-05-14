import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { tokenStorage } from '../../../core/auth/tokenStorage';
import { authService } from '../services/authService';
import type { User } from '../types/authTypes';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrapSession = async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();

      if (!accessToken) {
        await tokenStorage.clear();
        setUser(null);
        return;
      }

      const response = await authService.me();

      if (!response.success || !response.data) {
        await tokenStorage.clear();
        setUser(null);
        return;
      }

      await tokenStorage.setUser(response.data);
      setUser(response.data);
    } catch {
      await tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bootstrapSession();
  }, []);

  const signIn = async (nextUser: User) => {
    await tokenStorage.setUser(nextUser);
    setUser(nextUser);
  };

  const signOut = async () => {
    try {
      await authService.logout();
    } catch {
      // Backend logout hata verse bile local session kapatılır.
    } finally {
      await tokenStorage.clear();
      setUser(null);
    }
  };

  const refreshCurrentUser = async () => {
    const response = await authService.me();

    if (response.success && response.data) {
      await tokenStorage.setUser(response.data);
      setUser(response.data);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
      refreshCurrentUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return context;
};
