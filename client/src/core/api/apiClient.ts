import { toast } from "react-toastify";
import { AuthResponse } from "../../features/auth/types/authtypes"; 
import { ApiResponse } from "../../core/types/ApiResponse";

const BASE_URL = "http://localhost:8080/api/v1";

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem("accessToken");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, config);

    // 401 & Refresh Token Yönetimi
    if (response.status === 401 && !endpoint.includes("/auth/refresh-token")) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        handleLogout();
        throw new Error("Oturum süresi doldu.");
      }

      // Backend Refresh Token endpoint'ini çağır
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }), 
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const refreshResult: ApiResponse<AuthResponse> = await refreshResponse.json();

        // Backend'den gelen TokenResponseDto yapısına göre (accessToken ve refreshToken dönüyor)
        if (refreshResult.data) {
          localStorage.setItem("accessToken", refreshResult.data.accessToken);
          localStorage.setItem("refreshToken", refreshResult.data.refreshToken);
          
          const retryHeaders = {
            ...headers,
            "Authorization": `Bearer ${refreshResult.data.accessToken}`
          };
          
          // İlk isteği yeni token ile tekrar dene
          response = await fetch(`${BASE_URL}${endpoint}`, { ...config, headers: retryHeaders });
        }
      } else {
        handleLogout();
        throw new Error("Oturum süresi doldu.");
      }
    }

    const responseText = await response.text();
    let result: ApiResponse<T>;

    try {
      result = responseText 
        ? JSON.parse(responseText) 
        : { success: response.ok, message: "", data: null as T };
    } catch {
      result = {
        success: false,
        message: "Sunucu yanıtı okunamadı.",
        data: null as T,
        statusCode: response.status
      };
    }

    // Backend success: false dönüyorsa veya HTTP status hatalıysa
    if (!response.ok || result.success === false) {
      handleApiError(result);
      // Hata fırlatıyoruz ki useMutation veya try-catch blokları hatayı yakalasın
      throw result; 
    }

    // GET dışındaki başarılı işlemlerde (POST, PUT, DELETE) backend'den gelen mesajı göster
    if (options.method && options.method !== "GET" && result.message) {
      toast.success(result.message);
    }

    return result;

  } catch (error: any) {
    // Eğer hata zaten bir ApiResponse ise tekrar toast gösterme (handleApiError zaten gösterdi)
    if (error && typeof error === 'object' && 'success' in error) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Sunucu hatası.";
    toast.error(errorMessage);
    throw error;
  }
};

const handleLogout = () => {
  localStorage.clear();
  // Kullanıcıyı login ekranına at
  window.location.href = "/";
};

const handleApiError = (errorResponse: ApiResponse<any>) => {
  const message = errorResponse.message;
  // Backend'den gelen status koduna göre toast mesajları
  switch (errorResponse.statusCode) {
    case 403: toast.error("Bu işlem için yetkiniz bulunmamaktadır."); break;
    case 400: toast.error(message || "Hatalı istek yapıldı."); break;
    case 404: toast.error("İstenilen kaynak bulunamadı."); break;
    case 500: toast.error("Sunucu tarafında bir hata oluştu."); break;
    default: toast.error(message || "Beklenmedik bir hata oluştu."); break;
  }
};