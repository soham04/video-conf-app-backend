import { Response } from 'express';
import { Room } from '../models/Room';
import { AuthRequest } from '../types';
import { generateRoomId } from '../utils/helpers';

/**
 * Create a new room
 */
export const createRoom = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetName } = req.body;
    const userId = req.userId!;

    if (!meetName) {
      res.status(400).json({ error: 'Meeting name is required' });
      return;
    }

    const roomId = generateRoomId();

    const room = await Room.create({
      roomId,
      meetName,
      userId,
      chats: [],
    });

    res.status(201).json({
      success: true,
      room: {
        id: room._id,
        roomId: room.roomId,
        meetName: room.meetName,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

/**
 * Get room details by roomId
 */
export const getRoomDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        roomId: room.roomId,
        meetName: room.meetName,
        createdAt: room.createdAt,
        chats: room.chats,
      },
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
};

/**
 * Get user's room history
 */
export const getUserRooms = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const rooms = await Room.find({ userId })
      .sort({ createdAt: -1 })
      .select('roomId meetName createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      rooms: rooms.map((room) => ({
        id: room._id,
        roomId: room.roomId,
        meetName: room.meetName,
        createdAt: room.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

/**
 * Get room chat history
 */
export const getRoomChats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId }).select('chats');

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.status(200).json({
      success: true,
      chats: room.chats,
    });
  } catch (error) {
    console.error('Get room chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const userId = req.userId!;

    const room = await Room.findOne({ roomId, userId });

    if (!room) {
      res.status(404).json({ error: 'Room not found or unauthorized' });
      return;
    }

    await Room.deleteOne({ _id: room._id });

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};

