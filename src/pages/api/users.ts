import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { UserNote, UserStatus } from '@/types';
import { containsChinese } from '@/utils/validation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserNote[]>
) {
  try {
    const normalListPath = path.join(process.cwd(), 'src/data/normal_list.json');
    const yellowListPath = path.join(process.cwd(), 'src/data/yellow_list.json');
    const blackListPath = path.join(process.cwd(), 'src/data/black_list.json');
    const twitterIdsPath = path.join(process.cwd(), 'src/data/twitter_ids.json');

    // 读取所有文件
    const normalData = JSON.parse(fs.readFileSync(normalListPath, 'utf8')).users;
    const yellowData = JSON.parse(fs.readFileSync(yellowListPath, 'utf8')).users;
    const blackData = JSON.parse(fs.readFileSync(blackListPath, 'utf8')).users;
    const twitterIds = JSON.parse(fs.readFileSync(twitterIdsPath, 'utf8')).users;

    // 在 transformUser 函数之前添加检查
    const checkUserIds = (users: any[], listName: string) => {
      const invalidUsers = users.filter(user => containsChinese(user.user_id));
      if (invalidUsers.length > 0) {
        console.error(`发现包含中文字符的user_id在${listName}:`, 
          invalidUsers.map(u => ({
            user_id: u.user_id,
            tag: u.tag
          }))
        );
      }
      return invalidUsers;
    };

    // 检查各个列表
    const normalInvalid = checkUserIds(normalData, 'normal_list');
    const yellowInvalid = checkUserIds(yellowData, 'yellow_list');
    const blackInvalid = checkUserIds(blackData, 'black_list');

    // 如果发现无效的user_id，返回错误信息
    if (normalInvalid.length > 0 || yellowInvalid.length > 0 || blackInvalid.length > 0) {
      const invalidUsers = {
        normal: normalInvalid,
        yellow: yellowInvalid,
        black: blackInvalid
      };
      console.error('发现无效的user_id:', invalidUsers);
      return res.status(400).json({ 
        error: 'Invalid user_ids found',
        invalidUsers 
      });
    }

    // 转换数据格式的函数
    const transformUser = (user: any, status: UserStatus): UserNote => ({
      userid: twitterIds[user.user_id] || '',  // 使用保存的Twitter ID
      username: user.user_id,
      tag: user.tag,
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 转换数据
    const normalList = normalData.map((user: any) => transformUser(user, 'normal'));
    const yellowList = yellowData.map((user: any) => transformUser(user, 'warning'));
    const blackList = blackData.map((user: any) => transformUser(user, 'danger'));

    const allUsers = [...normalList, ...yellowList, ...blackList];
    
    res.status(200).json(allUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).json([]);
  }
} 