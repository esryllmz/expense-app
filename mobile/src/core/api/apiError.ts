import { AxiosError } from 'axios';
import type { ApiResponse } from '../types/ApiResponse';

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Beklenmeyen bir hata oluştu.'
) => {
  const axiosError = error as AxiosError<ApiResponse<unknown>>;

  return axiosError?.response?.data?.message || axiosError?.message || fallback;
};
