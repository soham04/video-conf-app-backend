import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { AuthRequest } from '../types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = req.cookies?.accessToken;
    const token = bearerToken || cookieToken;

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      req.user = user.toObject();
      req.userId = user._id.toString();
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

