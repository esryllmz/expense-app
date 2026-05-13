import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Backend URL'in
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Her isteğe token ekle
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 401 hatasında Refresh Token'ı kullan
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Backend /auth/refresh-token endpoint'ine istek at
        const { data } = await axios.post('/auth/refresh-token', { refreshToken });
        
        localStorage.setItem('accessToken', data.data.accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;