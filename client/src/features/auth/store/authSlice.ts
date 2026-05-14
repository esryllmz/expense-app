import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/authtypes';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const getStoredUser = (): User | null => {
  try {
    const value = localStorage.getItem('user');
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;

      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('accessToken', action.payload.accessToken);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;