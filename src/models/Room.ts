import mongoose, { Document, Schema } from 'mongoose';
import { IChat } from '../types';

export interface IRoomDocument extends Document {
  roomId: string;
  meetName: string;
  userId: string;
  chats: IChat[];
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    sendersName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    time: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new Schema<IRoomDocument>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetName: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    chats: {
      type: [chatSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ userId: 1, createdAt: -1 });

export const Room = mongoose.model<IRoomDocument>('Room', roomSchema);

