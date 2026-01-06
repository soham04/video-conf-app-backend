# Callify Backend API

TypeScript-based backend for Callify video conferencing application with Socket.IO for real-time communication.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (compatible with GCP)
- **Real-time**: Socket.IO
- **Authentication**: JWT + Firebase Auth

## Getting Started

### Prerequisites

- Node.js >= 16.x
- MongoDB (local or GCP Cloud MongoDB)
- Firebase project for authentication

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/callify
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
APP_NAME=Callify
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/firebase` - Authenticate with Firebase token
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

### Rooms
- `POST /api/rooms` - Create new room (protected)
- `GET /api/rooms/my-rooms` - Get user's room history (protected)
- `GET /api/rooms/:roomId` - Get room details (protected)
- `GET /api/rooms/:roomId/chats` - Get room chat history (protected)
- `DELETE /api/rooms/:roomId` - Delete room (protected)

## Socket.IO Events

### Client → Server
- `join` - Join a room
- `webrtc-signal` - WebRTC signaling (SDP/ICE)
- `send-chat-message` - Send chat message
- `drawing` - Whiteboard drawing data

### Server → Client
- `user-joined` - User joined room
- `user-left` - User left room
- `webrtc-signal` - WebRTC signaling
- `chat-message` - Chat message received
- `drawing` - Whiteboard drawing data

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (Socket.IO)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Application entry point
├── dist/                # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Deployment to GCP

1. Set up Cloud Run or App Engine
2. Configure Cloud MongoDB or use MongoDB Atlas
3. Set up Firebase Authentication
4. Update environment variables
5. Deploy:

## License

ISC

