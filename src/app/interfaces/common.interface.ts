export interface IUser {
  id: string;
  role: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ISendResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}
