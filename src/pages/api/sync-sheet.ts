import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, saveToJsonFiles } from '@/utils/googleSheets';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_PASSWORD || 'fallback_secret';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证 token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // 检查环境变量
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing credentials:', {
        email: !!process.env.GOOGLE_CLIENT_EMAIL,
        key: !!process.env.GOOGLE_PRIVATE_KEY
      });
      throw new Error('Missing Google API credentials');
    }

    console.log('Starting to fetch sheet data...');
    const users = await getSheetData();
    console.log(`Fetched ${users.length} users from sheet`);

    if (users.length === 0) {
      throw new Error('No data fetched from sheet');
    }

    console.log('Starting to save data to JSON files...');
    await saveToJsonFiles(users);
    console.log('Data saved successfully');

    const counts = users.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      message: 'Sync successful',
      counts: {
        normal: counts.normal || 0,
        warning: counts.warning || 0,
        danger: counts.danger || 0,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    res.status(500).json({
      message: 'Sync failed',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 