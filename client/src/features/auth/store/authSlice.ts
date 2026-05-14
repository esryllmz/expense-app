import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { sessionStorageService } from '../../../core/auth/sessionStorage';
import type { User } from '../types/authTypes';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const storedUser = sessionStorageService.getUser();
const storedToken = sessionStorageService.getAccessToken();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken?: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.loading = false;

      if (action.payload.refreshToken) {
        sessionStorageService.setSession({
          user: action.payload.user,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        });
      } else {
        sessionStorageService.setAccessToken(action.payload.accessToken);
        sessionStorageService.setUser(action.payload.user);
      }
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      sessionStorageService.setUser(action.payload);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;

      sessionStorageService.clearSession();
    },
  },
});

export const { setAuthLoading, setCredentials, setUser, logout } =
  authSlice.actions;

export default authSlice.reducer;