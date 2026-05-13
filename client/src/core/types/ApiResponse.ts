export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
  errors?: string[];
}

export type NoData = null;