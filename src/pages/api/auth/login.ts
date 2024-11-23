import type { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.ADMIN_PASSWORD || 'fallback_secret';
const SECRET_FILE = path.join(process.cwd(), 'src/data/auth_secret.json');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { password, code } = req.body;

    // 验证管理员密码
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // 读取2FA密钥
    const secretData = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8'));

    // 验证2FA代码
    const verified = speakeasy.totp.verify({
      secret: secretData.secret,
      encoding: 'base32',
      token: code,
      window: 1 // 允许前后1个时间窗口的代码
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }

    // 生成JWT token
    const token = sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
} 