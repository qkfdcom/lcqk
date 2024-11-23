import type { NextApiRequest, NextApiResponse } from 'next';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const SECRET_FILE = path.join(process.cwd(), 'src/data/auth_secret.json');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    // 验证管理员密码
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // 生成新的密钥
    const secret = speakeasy.generateSecret({
      name: 'LCQK Admin'
    });

    // 生成二维码
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // 保存密钥
    fs.writeFileSync(SECRET_FILE, JSON.stringify({
      secret: secret.base32,
      created_at: new Date().toISOString()
    }));

    res.status(200).json({
      qrCode: qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
} 