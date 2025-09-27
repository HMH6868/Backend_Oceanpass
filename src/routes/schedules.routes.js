import { Router } from 'express';
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  handleGetScheduleWithSeatMap,
  searchSchedules,
  updateSchedule,
} from '../controllers/schedules.controller.js';
import { checkAdminRole, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// --- PUBLIC ROUTES ---
router.get('/search', searchSchedules);
router.get('/', getSchedules);
// API MỚI: Lấy chi tiết một chuyến và sơ đồ ghế
router.get('/:id/seat-map', handleGetScheduleWithSeatMap);

// --- ADMIN ROUTES ---
router.post('/', requireAuth, checkAdminRole, createSchedule);
router.patch('/:id', requireAuth, checkAdminRole, updateSchedule);
router.delete('/:id', requireAuth, checkAdminRole, deleteSchedule);

export default router;
