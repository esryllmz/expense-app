export type UserRole = 'GM' | 'TEAM_LEADER' | 'EMPLOYEE';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}