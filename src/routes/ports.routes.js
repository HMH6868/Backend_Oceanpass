import { Router } from 'express';
import {
  createPort,
  deletePort,
  getPorts,
  updatePort,
} from '../controllers/ports.controller.js';
import { requireAuth, checkAdminRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getPorts);
router.post('/', requireAuth, checkAdminRole, createPort);
router.patch('/:id', requireAuth, checkAdminRole, updatePort);
router.delete('/:id', requireAuth, checkAdminRole, deletePort);

export default router;