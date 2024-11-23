import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { isAuthenticated } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  isAuthenticated(req, res, async () => {
    try {
      const { type } = req.query;
      
      // 读取对应的文件
      const getData = (fileType: string) => {
        const filePath = path.join(process.cwd(), `src/data/${fileType}_list.json`);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      };

      let data;
      if (type === 'all') {
        data = {
          normal: getData('normal'),
          warning: getData('yellow'),
          danger: getData('black')
        };
      } else {
        const fileName = type === 'warning' ? 'yellow' : type === 'danger' ? 'black' : 'normal';
        data = getData(fileName);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: 'Export failed' });
    }
  });
} 