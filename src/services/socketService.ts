import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Room } from '../models/Room';
import { WebRTCMessage, SocketUser } from '../types';

const activeSockets = new Map<string, SocketUser>();

export const initializeSocketServer = (server: HTTPServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    handleJoinRoom(socket, io);
    handleWebRTCSignaling(socket, io);
    handleChatMessage(socket, io);
    handleWhiteboard(socket, io);
    handleDisconnect(socket);
  });

  return io;
};

/**
 * Handle user joining a room
 */
function handleJoinRoom(socket: Socket, _io: Server): void {
  socket.on('join', async (data: string | SocketUser) => {
    try {
      const userData = typeof data === 'string' ? JSON.parse(data) : data;
      const { uuid, displayName, room } = userData;

      console.log(`👤 User ${displayName} joining room: ${room}`);

      // Store socket info
      activeSockets.set(socket.id, {
        uuid,
        displayName,
        room,
        socketId: socket.id,
      });

      // Join the room
      socket.join(room);

      // Create or update room in database
      const existingRoom = await Room.findOne({ roomId: room });
      if (!existingRoom) {
        console.log(`Creating room: ${room}`);
      }

      // Notify others in the room
      socket.broadcast.to(room).emit('user-joined', {
        uuid,
        displayName,
        socketId: socket.id,
      });

      // CRITICAL: Broadcast join as WebRTC signal (like original implementation)
      // This triggers WebRTC peer discovery in the frontend
      const joinMessage = JSON.stringify({
        uuid,
        displayName,
        dest: 'all',
        room,
      });
      console.log(`📢 Broadcasting join message to room ${room}:`, joinMessage);
      socket.broadcast.to(room).emit('message_from_server', joinMessage);

      // Send confirmation to the joining user
      socket.emit('join-success', {
        room,
        uuid,
        displayName,
      });

      console.log(`✅ User ${displayName} joined room ${room}`);
    } catch (error) {
      console.error('Error in join handler:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
}

/**
 * Handle WebRTC signaling (SDP offers/answers and ICE candidates)
 */
function handleWebRTCSignaling(socket: Socket, io: Server): void {
  socket.on('webrtc-signal', (message: string | WebRTCMessage) => {
    try {
      const signal = typeof message === 'string' ? JSON.parse(message) : message;
      const { dest, room } = signal;

      console.log(`📡 WebRTC signal from ${socket.id} to ${dest} in room ${room}`, {
        hasDisplayName: !!signal.displayName,
        hasSDP: !!signal.sdp,
        hasICE: !!signal.ice,
      });

      if (dest === 'all') {
        // Broadcast to all in room except sender
        console.log(`  📢 Broadcasting to all in room ${room}`);
        socket.broadcast.to(room).emit('webrtc-signal', signal);
      } else {
        // Send to specific peer
        const targetSockets = Array.from(activeSockets.entries())
          .filter(([_, user]) => user.uuid === dest)
          .map(([socketId]) => socketId);

        console.log(`  🎯 Sending to specific peer: ${dest}, found ${targetSockets.length} socket(s)`);
        targetSockets.forEach((targetSocketId) => {
          io.to(targetSocketId).emit('webrtc-signal', signal);
        });
      }
    } catch (error) {
      console.error('Error in WebRTC signaling:', error);
    }
  });

  // Backward compatibility with old client
  socket.on('message_from_client', (message: string) => {
    try {
      const signal = JSON.parse(message);
      const { dest, room } = signal;

      if (dest === 'all') {
        socket.broadcast.to(room).emit('message_from_server', message);
      } else {
        const targetSockets = Array.from(activeSockets.entries())
          .filter(([_, user]) => user.uuid === dest)
          .map(([socketId]) => socketId);

        targetSockets.forEach((targetSocketId) => {
          io.to(targetSocketId).emit('message_from_server', message);
        });
      }
    } catch (error) {
      console.error('Error in message handler:', error);
    }
  });
}

/**
 * Handle chat messages
 */
function handleChatMessage(socket: Socket, _io: Server): void {
  socket.on('send-chat-message', async (data: any) => {
    try {
      const { room, displayname, message, uuid } = data;

      console.log(`💬 Chat message in room ${room} from ${displayname}`);

      const chatMessage = {
        sendersName: displayname,
        message: message,
        time: new Date(),
      };

      // Save to database
      await Room.updateOne(
        { roomId: room },
        {
          $push: { chats: chatMessage },
          $setOnInsert: {
            meetName: 'Unnamed Meeting',
            userId: uuid,
          },
        },
        { upsert: true }
      );

      // Broadcast to others in room (NOT including sender)
      socket.broadcast.to(room).emit('chat-message', {
        ...data,
        time: chatMessage.time,
      });
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}

/**
 * Handle whiteboard drawing events
 */
function handleWhiteboard(socket: Socket, _io: Server): void {
  socket.on('drawing', (data: any) => {
    try {
      const { room, data: drawingData } = data;

      // Broadcast drawing to others in room
      socket.broadcast.to(room).emit('drawing', drawingData);
    } catch (error) {
      console.error('Error handling drawing:', error);
    }
  });
}

/**
 * Handle user disconnect
 */
function handleDisconnect(socket: Socket): void {
  socket.on('disconnect', () => {
    const user = activeSockets.get(socket.id);

    if (user) {
      console.log(`❌ User ${user.displayName} disconnected from room ${user.room}`);

      // Notify others in the room
      socket.broadcast.to(user.room).emit('user-left', {
        uuid: user.uuid,
        displayName: user.displayName,
      });

      activeSockets.delete(socket.id);
    }

    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
}

export const getActiveSockets = (): Map<string, SocketUser> => {
  return activeSockets;
};

