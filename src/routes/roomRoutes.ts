import { Router } from 'express';
import {
  createRoom,
  getRoomDetails,
  getUserRooms,
  getRoomChats,
  deleteRoom,
} from '../controllers/roomController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

router.post('/', createRoom);
router.get('/my-rooms', getUserRooms);
router.get('/:roomId', getRoomDetails);
router.get('/:roomId/chats', getRoomChats);
router.delete('/:roomId', deleteRoom);

export default router;

