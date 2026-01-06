import { Response } from 'express';
import { User } from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../types';

const isProduction = process.env.NODE_ENV === 'production';

const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  const commonOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none' as const,
    path: '/',
  };

  res.cookie('accessToken', tokens.accessToken, {
    ...commonOptions,
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    ...commonOptions,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

/**
 * Register or login user with Firebase Auth token
 * This endpoint will be called from frontend after Firebase authentication
 */
export const authenticateWithFirebase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { firebaseUid, email, name, photoURL } = req.body;

    if (!firebaseUid || !email || !name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        name,
        photoURL,
      });
    } else if (!user.firebaseUid) {
      // Update existing user with Firebase UID
      user.firebaseUid = firebaseUid;
      user.name = name;
      user.photoURL = photoURL;
      await user.save();
    }

    // Generate JWT tokens
    const tokens = generateTokens(user._id.toString(), user.email);

    setAuthCookies(res, tokens);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = generateTokens(user._id.toString(), user.email);

    setAuthCookies(res, tokens);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        photoURL: req.user.photoURL,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Logout user (client-side token removal, but can be used for logging)
 */
export const logout = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

