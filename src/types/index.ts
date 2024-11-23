// 用户备注信息的类型定义
export type UserStatus = 'normal' | 'warning' | 'danger';

export interface UserNote {
  userid: string;
  username: string;
  tag: string;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
} 