import { Router } from 'express';
import {
  createRoute,
  deleteRoute,
  getRoutes,
  updateRoute,
} from '../controllers/routes.controller.js';
import { requireAuth, checkAdminRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getRoutes);
router.post('/', requireAuth, checkAdminRole, createRoute);
router.patch('/:id', requireAuth, checkAdminRole, updateRoute);
router.delete('/:id', requireAuth, checkAdminRole, deleteRoute);

export default router;