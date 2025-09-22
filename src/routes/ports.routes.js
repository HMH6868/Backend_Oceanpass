import { Router } from 'express';
import {
  handleListPorts,
  handleGetPort,
  handleCreatePort,
  handleUpdatePort,
  handleDeletePort
} from '../controllers/ports.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public
router.get('/', handleListPorts);
router.get('/:id', handleGetPort);

// Protected (role_id 1 or 2)
router.post('/', requireAuth, handleCreatePort);
router.patch('/:id', requireAuth, handleUpdatePort);
router.delete('/:id', requireAuth, handleDeletePort);

export default router;
