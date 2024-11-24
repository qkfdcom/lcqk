import { UserNote } from '@/types';

export async function getUserData(): Promise<UserNote[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    
    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Invalid response format');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
} 