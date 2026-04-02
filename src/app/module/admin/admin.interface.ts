export interface IAdminUserListQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export type UserRole = "MEMBER" | "ADMIN";
