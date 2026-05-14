import type { User } from '../../features/auth/types/authtypes';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const sessionStorageService = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  getUser: (): User | null => {
    try {
      const value = localStorage.getItem(USER_KEY);
      return value ? (JSON.parse(value) as User) : null;
    } catch {
      return null;
    }
  },

  setSession: ({
    accessToken,
    refreshToken,
    user,
  }: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setAccessToken: (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  hasAnyToken: () => {
    return Boolean(
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
        localStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },
};