import { Router } from 'express';
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  searchSchedules,
  updateSchedule,
} from '../controllers/schedules.controller.js';
import { checkAdminRole, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// --- PUBLIC ROUTES ---
// API tìm kiếm chuyến đi
router.get('/search', searchSchedules);
router.get('/', getSchedules);

// --- ADMIN ROUTES ---
router.post('/', requireAuth, checkAdminRole, createSchedule);
router.patch('/:id', requireAuth, checkAdminRole, updateSchedule);
router.delete('/:id', requireAuth, checkAdminRole, deleteSchedule);

export default router;
