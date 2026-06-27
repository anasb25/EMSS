import { RoleName } from '../../roles/entities/role.entity';

export interface SafeUser {
  id: string;
  username: string;
  role: RoleName;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersPaginatedResult {
  data: SafeUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
