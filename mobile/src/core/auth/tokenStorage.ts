import * as SecureStore from 'expo-secure-store';
import type { User } from '../../features/auth/types/authTypes';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const tokenStorage = {
  async setAccessToken(token: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUser(user: User) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const value = await SecureStore.getItemAsync(USER_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as User;
    } catch {
      await SecureStore.deleteItemAsync(USER_KEY);
      return null;
    }
  },

  async setSession(params: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) {
    await Promise.all([
      this.setAccessToken(params.accessToken),
      this.setRefreshToken(params.refreshToken),
      this.setUser(params.user),
    ]);
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
