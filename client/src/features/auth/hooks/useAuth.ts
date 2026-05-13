import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { authService } from "../services/authservice";
import { setCredentials, logout as logoutAction } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Login Mutasyonu
  const loginMutation = useMutation({
    mutationFn: (credentials: any) => authService.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Tokenları kaydet
        localStorage.setItem("accessToken", response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }

        // Redux State'ini güncelle
        dispatch(setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken
        }));

        // Dashboard'a yönlendir
        navigate("/dashboard");
      }
    },
  });

  // Register Mutasyonu
  const registerMutation = useMutation({
    mutationFn: (data: any) => authService.register(data),
    // onSuccess yönlendirmesini AuthPage içinden yapacağız ki formu temizleyip Login ekranına geçebilsin
  });

  // Çıkış Mutasyonu
  const logout = async () => {
    try {
      // Backend'deki token'ı karalisteye (blacklist) almak için
      await authService.logout(); 
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // API hata verse bile frontend'de oturumu mutlaka kapat
      dispatch(logoutAction());
      navigate("/");
    }
  };

  return {
    // mutateAsync sayesinde hataları (try-catch) AuthPage içinde yakalayabiliriz
    login: loginMutation.mutateAsync, 
    isLoginLoading: loginMutation.isPending,
    
    register: registerMutation.mutateAsync,
    isRegisterLoading: registerMutation.isPending,
    
    logout,
  };
};