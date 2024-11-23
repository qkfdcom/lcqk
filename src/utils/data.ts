import { UserNote } from '@/types';

export async function getUserData(): Promise<UserNote[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return data.data || [];
} 