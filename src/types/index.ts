import { Request } from 'express';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  photoURL?: string;
  firebaseUid?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoom {
  _id?: string;
  roomId: string;
  meetName: string;
  userId: string;
  createdAt?: Date;
  chats: IChat[];
}

export interface IChat {
  sendersName: string;
  message: string;
  time: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  body: Request['body'];
  params: Request['params'];
  headers: Request['headers'] & { authorization?: string };
  cookies: Request['cookies'];
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface SocketUser {
  uuid: string;
  displayName: string;
  room: string;
  socketId: string;
}

export interface WebRTCSessionDescription {
  type: "offer" | "answer";
  sdp: string;
}

export interface WebRTCIceCandidate {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export interface WebRTCMessage {
  type?: "join" | "offer" | "answer" | "ice";
  uuid: string;
  displayName?: string;
  dest: string;
  room: string;
  sdp?: WebRTCSessionDescription;
  ice?: WebRTCIceCandidate;
}
