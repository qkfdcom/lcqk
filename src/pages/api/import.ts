import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { isAuthenticated } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  isAuthenticated(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
      const { type, data } = req.body;
      
      // 确定要写入的文件
      const fileName = type === 'warning' ? 'yellow' : type === 'danger' ? 'black' : 'normal';
      const filePath = path.join(process.cwd(), `src/data/${fileName}_list.json`);

      // 验证数据格式
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('Invalid data format');
      }

      // 写入文件
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      res.status(200).json({ message: 'Import successful' });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: 'Import failed' });
    }
  });
} 