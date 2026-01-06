import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { Room } from "../models/Room";
import { SocketUser } from "../types";

/* ---------- NODE-SAFE WEBRTC TYPES ---------- */

type WebRTCSessionDescription = {
  type: "offer" | "answer";
  sdp: string;
};

type WebRTCIceCandidate = {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
};

type WebRTCSignal =
  | {
    type: "join";
    uuid: string;
    displayName: string;
    room: string;
  }
  | {
    type: "offer" | "answer";
    uuid: string;
    dest: string;
    room: string;
    sdp: WebRTCSessionDescription;
  }
  | {
    type: "ice";
    uuid: string;
    dest: string;
    room: string;
    ice: WebRTCIceCandidate;
  };

const activeSockets = new Map<string, SocketUser>();

export const initializeSocketServer = (server: HTTPServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.on("connection", (socket: Socket) => {
    console.log("✅ Client connected:", socket.id);

    handleJoinRoom(socket);
    handleWebRTCSignaling(socket, io);
    handleChatMessage(socket);
    handleWhiteboard(socket);
    handleDisconnect(socket);
  });

  return io;
};

/* ---------------- JOIN ROOM ---------------- */

function handleJoinRoom(socket: Socket): void {
  socket.on("join", async ({ uuid, displayName, room }: SocketUser) => {
    console.log(`👤 ${displayName} joining room ${room}`);

    activeSockets.set(socket.id, {
      uuid,
      displayName,
      room,
      socketId: socket.id,
    });

    socket.join(room);

    await Room.updateOne(
      { roomId: room },
      { $setOnInsert: { meetName: "Unnamed Meeting", userId: uuid } },
      { upsert: true }
    );

    // 🔥 WebRTC discovery
    socket.broadcast.to(room).emit("webrtc-signal", {
      type: "join",
      uuid,
      displayName,
      room,
    });

    socket.emit("join-success", { room, uuid, displayName });
  });
}

/* ---------------- WEBRTC SIGNALING ---------------- */

function handleWebRTCSignaling(socket: Socket, io: Server): void {
  socket.on("webrtc-signal", (signal: WebRTCSignal) => {
    const { dest, room } = signal as any;
    if (!room) return;

    for (const [socketId, user] of activeSockets.entries()) {
      if (user.uuid === dest) {
        io.to(socketId).emit("webrtc-signal", signal);
        return;
      }
    }
  });
}

/* ---------------- CHAT ---------------- */

function handleChatMessage(socket: Socket): void {
  socket.on("send-chat-message", async (data: any) => {
    const { room, displayname, message } = data;

    const chatMessage = {
      sendersName: displayname,
      message,
      time: new Date(),
    };

    await Room.updateOne(
      { roomId: room },
      { $push: { chats: chatMessage } }
    );

    socket.broadcast.to(room).emit("chat-message", {
      ...data,
      time: chatMessage.time,
    });
  });
}

/* ---------------- WHITEBOARD ---------------- */

function handleWhiteboard(socket: Socket): void {
  socket.on("drawing", ({ room, data }) => {
    socket.broadcast.to(room).emit("drawing", data);
  });
}

/* ---------------- DISCONNECT ---------------- */

function handleDisconnect(socket: Socket): void {
  socket.on("disconnect", () => {
    const user = activeSockets.get(socket.id);
    if (!user) return;

    socket.broadcast.to(user.room).emit("user-left", {
      uuid: user.uuid,
      displayName: user.displayName,
    });

    activeSockets.delete(socket.id);
    console.log(`❌ ${user.displayName} disconnected`);
  });
}

export const getActiveSockets = () => activeSockets;
