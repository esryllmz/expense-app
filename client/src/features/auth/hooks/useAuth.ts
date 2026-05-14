import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { ApiResponse, NoData } from '../../../core/types/ApiResponse';
import { authService } from '../services/authservice';
import { logout as logoutAction, setCredentials } from '../store/authSlice';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/authtypes';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation<ApiResponse<AuthResponse>, unknown, LoginRequest>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (response) => {
      if (!response.success || !response.data) return;

      dispatch(
        setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        })
      );

      navigate('/dashboard', { replace: true });
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
      navigate('/', { replace: true });
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