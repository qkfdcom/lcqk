import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getBatchTwitterUserIds } from '@/utils/twitter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Starting yellow list ID fetch...');
    
    // 读取黄名单和已存储的Twitter ID
    const yellowListPath = path.join(process.cwd(), 'src/data/yellow_list.json');
    const twitterIdsPath = path.join(process.cwd(), 'src/data/twitter_ids.json');

    // 确保文件存在
    if (!fs.existsSync(yellowListPath)) {
      throw new Error(`Yellow list file not found at: ${yellowListPath}`);
    }
    if (!fs.existsSync(twitterIdsPath)) {
      // 如果twitter_ids.json不存在，创建一个空的
      fs.writeFileSync(twitterIdsPath, JSON.stringify({ users: {} }, null, 2));
    }

    // 读取文件内容
    const yellowListContent = fs.readFileSync(yellowListPath, 'utf8');
    console.log('Yellow list content:', yellowListContent);

    const yellowList = JSON.parse(yellowListContent).users;
    console.log('Parsed yellow list:', yellowList);

    const twitterIds = JSON.parse(fs.readFileSync(twitterIdsPath, 'utf8')).users;
    console.log('Existing Twitter IDs:', twitterIds);

    // 过滤出还没有获取过ID的用户
    const usersToFetch = yellowList.filter((user: any) => {
      const needsFetch = !twitterIds[user.user_id];
      console.log(`User ${user.user_id} needs fetch: ${needsFetch}`);
      return needsFetch;
    });
    
    console.log('Users to fetch:', usersToFetch);
    
    if (usersToFetch.length === 0) {
      console.log('No new users to fetch');
      return res.status(200).json({ message: 'No new users to fetch' });
    }

    // 获取新用户的Twitter ID
    const usernames = usersToFetch.map((user: any) => user.user_id);
    console.log('Fetching IDs for usernames:', usernames);
    
    const newIds = await getBatchTwitterUserIds(usernames);
    console.log('Fetched new IDs:', newIds);

    // 合并新旧数据
    const updatedIds = {
      users: {
        ...twitterIds,
        ...newIds
      }
    };

    // 保存更新后的数据
    fs.writeFileSync(twitterIdsPath, JSON.stringify(updatedIds, null, 2));
    console.log('Saved updated IDs to file');

    res.status(200).json({
      message: `Successfully fetched ${Object.keys(newIds).length} new Twitter IDs`,
      newIds,
      debug: {
        yellowListPath,
        yellowListExists: fs.existsSync(yellowListPath),
        yellowListUsers: yellowList.length,
        usersToFetch: usersToFetch.length,
        usernames
      }
    });
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ 
      message: 'Failed to fetch Twitter IDs',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error
    });
  }
} 