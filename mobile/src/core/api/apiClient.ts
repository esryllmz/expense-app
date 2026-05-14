import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import type { ApiResponse } from '../types/ApiResponse';
import type { AuthResponse } from '../../features/auth/types/authTypes';

/**
 * Android Emulator için localhost yerine 10.0.2.2 kullanılır.
 * Çünkü emulator içindeki localhost, bilgisayarını değil emulator'ın kendisini gösterir.
 */
const BASE_URL = 'http://10.0.2.2:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isAuthEndpoint = (url?: string) => {
  return (
    url?.includes('/auth/login') ||
    url?.includes('/auth/register') ||
    url?.includes('/auth/refresh-token')
  );
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
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const refreshToken = await tokenStorage.getRefreshToken();

      if (!refreshToken) {
        await tokenStorage.clear();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const authData = refreshResponse.data.data;

        if (!refreshResponse.data.success || !authData) {
          await tokenStorage.clear();
          return Promise.reject(error);
        }

        await tokenStorage.setAccessToken(authData.accessToken);
        await tokenStorage.setRefreshToken(authData.refreshToken);
        await tokenStorage.setUser(authData.user);

        originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        await tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);