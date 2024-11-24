export type UserStatus = 'normal' | 'warning' | 'danger';

export interface UserNote {
  user_id: string;
  tag: string;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: UserNote[];
  error?: string;
} 