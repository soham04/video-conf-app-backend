import { Response } from 'express';
import { User } from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../types';

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

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
      ...tokens,
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
    const { refreshToken } = req.body;

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

    res.status(200).json({
      success: true,
      ...tokens,
    });
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
    // In JWT-based auth, logout is primarily client-side
    // But you can log the event or implement token blacklisting here
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

