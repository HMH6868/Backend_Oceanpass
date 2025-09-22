import { Router } from 'express';
import {
  handleListRoutes,
  handleGetRoute,
  handleCreateRoute,
  handleUpdateRoute,
  handleDeleteRoute
} from '../controllers/routes.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public
router.get('/', handleListRoutes);
router.get('/:id', handleGetRoute);

// Protected (role_id 1 or 2)
router.post('/', requireAuth, handleCreateRoute);
router.patch('/:id', requireAuth, handleUpdateRoute);
router.delete('/:id', requireAuth, handleDeleteRoute);

export default router;
