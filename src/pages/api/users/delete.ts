import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { isAuthenticated } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 添加认证检查
  isAuthenticated(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
      const { status, username } = req.body;

      // 根据状态确定要编辑的文件
      let filePath;
      switch (status) {
        case 'normal':
          filePath = path.join(process.cwd(), 'src/data/normal_list.json');
          break;
        case 'warning':
          filePath = path.join(process.cwd(), 'src/data/yellow_list.json');
          break;
        case 'danger':
          filePath = path.join(process.cwd(), 'src/data/black_list.json');
          break;
        default:
          throw new Error('Invalid status');
      }

      // 读取文件
      const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // 过滤掉要删除的用户
      const updatedUsers = fileContent.users.filter((user: any) => user.user_id !== username);

      // 写回文件
      fs.writeFileSync(filePath, JSON.stringify({ users: updatedUsers }, null, 2));

      res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });
} 