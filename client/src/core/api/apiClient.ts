import { toast } from 'react-toastify';
import type { AuthResponse } from '../../features/auth/types/authtypes';
import type { ApiResponse } from '../types/ApiResponse';

const BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('accessToken');

  const isAuthEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/refresh-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Login, register ve refresh-token public endpoint olduğu için eski token göndermiyoruz.
  if (token && !isAuthEndpoint) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Access token süresi dolduysa refresh token ile yenile.
    if (response.status === 401 && !endpoint.includes('/auth/refresh-token')) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        handleLogout();
        throw new Error('Oturum süresi doldu.');
      }

      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        handleLogout();
        throw new Error('Oturum süresi doldu.');
      }

      const refreshResult: ApiResponse<AuthResponse> = await refreshResponse.json();

      if (!refreshResult.success || !refreshResult.data) {
        handleLogout();
        throw new Error(refreshResult.message || 'Oturum yenilenemedi.');
      }

      localStorage.setItem('accessToken', refreshResult.data.accessToken);
      localStorage.setItem('refreshToken', refreshResult.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(refreshResult.data.user));

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${refreshResult.data.accessToken}`,
      };

      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...config,
        headers: retryHeaders,
      });
    }

    const responseText = await response.text();

    const result: ApiResponse<T> = responseText
      ? JSON.parse(responseText)
      : {
          success: response.ok,
          message: '',
          data: null,
          statusCode: response.status,
        };

    if (!response.ok || result.success === false) {
      handleApiError(result);
      throw result;
    }

    if (options.method && options.method !== 'GET' && result.message) {
      toast.success(result.message);
    }

    return result;
  } catch (error: any) {
    if (error && typeof error === 'object' && 'success' in error) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Sunucu hatası.';
    toast.error(errorMessage);
    throw error;
  }
};

const handleLogout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  window.location.href = '/';
};

const handleApiError = (errorResponse: ApiResponse<any>) => {
  const message = errorResponse.message;

  switch (errorResponse.statusCode) {
    case 400:
      toast.error(message || 'Validasyon hatası oluştu.');
      break;
    case 403:
      toast.error('Bu işlem için yetkiniz bulunmamaktadır.');
      break;
    case 404:
      toast.error('İstenilen kaynak bulunamadı.');
      break;
    case 500:
      toast.error('Sunucu tarafında bir hata oluştu.');
      break;
    default:
      toast.error(message || 'Beklenmedik bir hata oluştu.');
      break;
  }
};