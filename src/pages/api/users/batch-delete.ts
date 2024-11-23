import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userIds, listType } = req.body;

    // 根据列表类型确定文件路径
    let filePath;
    switch (listType) {
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
        throw new Error('Invalid list type');
    }

    // 读取文件
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 过滤掉要删除的用户
    const updatedUsers = fileContent.users.filter((user: any) => 
      !userIds.includes(user.user_id)
    );

    // 写回文件
    fs.writeFileSync(filePath, JSON.stringify({ users: updatedUsers }, null, 2));

    res.status(200).json({ 
      message: 'Users deleted successfully',
      deletedCount: fileContent.users.length - updatedUsers.length
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Failed to delete users' });
  }
} 