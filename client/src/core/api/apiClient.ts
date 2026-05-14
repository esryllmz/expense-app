import { toast } from 'react-toastify';
import type { AuthResponse } from '../../features/auth/types/authtypes';
import type { ApiResponse } from '../types/ApiResponse';
import { sessionStorageService } from '../auth/sessionStorage';

const BASE_URL = 'http://localhost:8080/api/v1';

let isRefreshing = false;

type WaitingRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let waitingRequests: WaitingRequest[] = [];

const isAuthEndpoint = (endpoint: string) => {
  return (
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/refresh-token')
  );
};

const processWaitingRequests = (error: unknown, token: string | null) => {
  waitingRequests.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }

    if (token) {
      request.resolve(token);
    }
  });

  waitingRequests = [];
};

const waitForRefreshToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    waitingRequests.push({ resolve, reject });
  });
};

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const responseText = await response.text();

  if (!responseText) {
    return {
      success: response.ok,
      message: '',
      data: null,
      statusCode: response.status,
    };
  }

  try {
    return JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: 'Sunucudan geçersiz cevap döndü.',
      data: null,
      statusCode: response.status,
    };
  }
};

export const clearSessionAndRedirect = () => {
  sessionStorageService.clearSession();

  if (window.location.pathname !== '/') {
    window.location.replace('/');
  }
};

const handleApiError = (errorResponse: ApiResponse<unknown>) => {
  const message = errorResponse.message;

  switch (errorResponse.statusCode) {
    case 400:
      toast.error(message || 'Validasyon hatası oluştu.');
      break;
    case 401:
      toast.error(message || 'Oturum süresi doldu.');
      break;
    case 403:
      toast.error(message || 'Bu işlem için yetkiniz bulunmamaktadır.');
      break;
    case 404:
      toast.error(message || 'İstenilen kaynak bulunamadı.');
      break;
    case 500:
      toast.error('Sunucu tarafında bir hata oluştu.');
      break;
    default:
      toast.error(message || 'Beklenmedik bir hata oluştu.');
      break;
  }
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = sessionStorageService.getRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh token bulunamadı.');
  }

  const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const refreshResult = await parseResponse<AuthResponse>(refreshResponse);

  if (!refreshResponse.ok || !refreshResult.success || !refreshResult.data) {
    throw new Error(refreshResult.message || 'Oturum yenilenemedi.');
  }

  sessionStorageService.setSession({
    accessToken: refreshResult.data.accessToken,
    refreshToken: refreshResult.data.refreshToken,
    user: refreshResult.data.user,
  });

  return refreshResult.data.accessToken;
};

const retryRequestAfterRefresh = async (
  endpoint: string,
  config: RequestInit,
  headers: Record<string, string>
): Promise<Response> => {
  if (!sessionStorageService.getRefreshToken()) {
    clearSessionAndRedirect();
    throw new Error('Oturum süresi doldu.');
  }

  if (isRefreshing) {
    const newAccessToken = await waitForRefreshToken();

    return fetch(`${BASE_URL}${endpoint}`, {
      ...config,
      headers: {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
  }

  isRefreshing = true;

  try {
    const newAccessToken = await refreshAccessToken();

    processWaitingRequests(null, newAccessToken);

    return fetch(`${BASE_URL}${endpoint}`, {
      ...config,
      headers: {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
  } catch (error) {
    processWaitingRequests(error, null);
    clearSessionAndRedirect();
    throw error;
  } finally {
    isRefreshing = false;
  }
};

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = sessionStorageService.getAccessToken();
  const authEndpoint = isAuthEndpoint(endpoint);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body
      ? { 'Content-Type': 'application/json; charset=UTF-8' }
      : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token && !authEndpoint) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401 && !authEndpoint) {
      response = await retryRequestAfterRefresh(endpoint, config, headers);
    }

    const result = await parseResponse<T>(response);

    if (!response.ok || result.success === false) {
      handleApiError(result);
      throw result;
    }

    const method = options.method?.toUpperCase();

    if (method && method !== 'GET' && result.message) {
      toast.success(result.message);
    }

    return result;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'success' in error) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Sunucu hatası.';

    toast.error(errorMessage);
    throw error;
  }
};