import { verify } from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.ADMIN_PASSWORD || 'fallback_secret';

export function isAuthenticated(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
} 