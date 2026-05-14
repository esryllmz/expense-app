import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';
import { tokenStorage } from '../auth/tokenStorage';
import type { ApiResponse } from '../types/ApiResponse';
import type { AuthResponse } from '../../features/auth/types/authTypes';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<AuthResponse | null> | null = null;

const isAuthEndpoint = (url?: string) => {
  return (
    url?.includes('/auth/login') ||
    url?.includes('/auth/register') ||
    url?.includes('/auth/refresh-token')
  );
};

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    Accept: 'application/json',
  },
});

const refreshSession = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();

    if (!refreshToken) {
      await tokenStorage.clear();
      return null;
    }

    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_CONFIG.BASE_URL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
          },
        }
      );

      const authData = response.data.data;

      if (!response.data.success || !authData) {
        await tokenStorage.clear();
        return null;
      }

      await tokenStorage.setSession(authData);

      return authData;
    } catch {
      await tokenStorage.clear();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!isAuthEndpoint(config.url)) {
    const token = await tokenStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const authData = await refreshSession();

    if (!authData) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;

    return apiClient(originalRequest);
  }
);
