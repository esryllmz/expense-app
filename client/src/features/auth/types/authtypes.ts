export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Backend'deki register endpoint'ine uygun request tipi
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}