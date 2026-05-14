import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authservice';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/authtypes';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation<ApiResponse<AuthResponse>, unknown, LoginRequest>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.accessToken,
          })
        );

        navigate('/dashboard');
      }
    },
  });

  const registerMutation = useMutation<ApiResponse<NoData>, unknown, RegisterRequest>({
    mutationFn: (data) => authService.register(data),
  });

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      dispatch(logoutAction());
      navigate('/');
    }
  };

  return {
    login: loginMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,

    register: registerMutation.mutateAsync,
    isRegisterLoading: registerMutation.isPending,

    logout,
  };
};