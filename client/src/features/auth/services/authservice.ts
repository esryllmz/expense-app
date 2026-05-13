import { apiClient } from '../../../core/api/apiClient';

export const authService = {
  login: async (credentials: any) => {
    return await apiClient<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  register: async (data: any) => {
    return await apiClient<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    return await apiClient<any>('/auth/logout', {
      method: 'POST',
    });
  }
};