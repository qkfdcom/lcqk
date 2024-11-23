import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getTwitterUserId } from '@/utils/twitter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    console.log('Fetching ID for username:', username);

    const twitterIdsPath = path.join(process.cwd(), 'src/data/twitter_ids.json');

    // 确保 twitter_ids.json 存在
    if (!fs.existsSync(twitterIdsPath)) {
      fs.writeFileSync(twitterIdsPath, JSON.stringify({ users: {} }, null, 2));
    }

    // 获取Twitter ID
    const userid = await getTwitterUserId(username);
    if (!userid) {
      return res.status(404).json({ message: 'Twitter user not found' });
    }

    // 读取并更新twitter_ids.json
    const twitterIds = JSON.parse(fs.readFileSync(twitterIdsPath, 'utf8'));
    twitterIds.users[username] = userid;
    fs.writeFileSync(twitterIdsPath, JSON.stringify(twitterIds, null, 2));

    console.log('Successfully saved ID:', userid, 'for username:', username);

    res.status(200).json({ 
      message: 'Successfully fetched user ID',
      userid,
      username 
    });
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch user ID'
    });
  }
} 