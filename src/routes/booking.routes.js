import express from 'express';
import { handleGetBookings, handleCreateBooking, handleUpdateBooking, handleDeleteBooking } from '../controllers/booking.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/bookings - Lấy danh sách bookings
router.get('/', handleGetBookings);

// POST /api/bookings - Tạo booking mới
router.post('/', requireAuth, handleCreateBooking);

// PUT /api/bookings/:id - Cập nhật booking
router.put('/:id', requireAuth, handleUpdateBooking);

// DELETE /api/bookings/:id - Xóa booking
router.delete('/:id', requireAuth, handleDeleteBooking);

export default router;
