import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { isAuthenticated } from '@/utils/auth';
import { UserNote, ApiResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  isAuthenticated(req, res, async () => {
    try {
      // 读取所有JSON文件
      const dataDir = path.join(process.cwd(), 'src/data');
      const normalList = JSON.parse(fs.readFileSync(path.join(dataDir, 'normal_list.json'), 'utf8'));
      const yellowList = JSON.parse(fs.readFileSync(path.join(dataDir, 'yellow_list.json'), 'utf8'));
      const blackList = JSON.parse(fs.readFileSync(path.join(dataDir, 'black_list.json'), 'utf8'));

      // 合并所有用户数据并添加状态标记
      const allUsers: UserNote[] = [
        ...normalList.users.map((user: any) => ({ ...user, status: 'normal' as const })),
        ...yellowList.users.map((user: any) => ({ ...user, status: 'warning' as const })),
        ...blackList.users.map((user: any) => ({ ...user, status: 'danger' as const }))
      ];

      res.status(200).json({
        success: true,
        data: allUsers
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  });
} 