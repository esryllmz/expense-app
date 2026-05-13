export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
    errors?: string[];
}

export interface AuthResponse {
    accessToken: string;
    tokenType: string;
}