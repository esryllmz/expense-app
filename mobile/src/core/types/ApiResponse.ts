export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
  errors?: string[] | Record<string, string>;
}
