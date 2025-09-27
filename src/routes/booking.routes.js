import { Router } from 'express';
import {
  handleAddPassengers,
  handleApplyPromotion,
  handleConfirmCashPayment,
  handleCreateBooking,
  handleGetBooking,
  handleGetBookingFullDetails,
  handleGetBookingTickets,
  handleGetUserBookings,
} from '../controllers/booking.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, handleCreateBooking);

router.get('/my-bookings', requireAuth, handleGetUserBookings);

// Endpoint để lấy thông tin chi tiết của một đơn hàng
router.get('/:id', handleGetBooking);
router.patch('/:id/promotion', handleApplyPromotion);
router.post('/:id/passengers', handleAddPassengers);
router.get('/:id/full-details', handleGetBookingFullDetails);

// API Lấy danh sách vé của một đơn hàng
router.get('/:id/tickets', requireAuth, handleGetBookingTickets);

// dùng cho thanh toán bằng tiền mặt
router.post('/:id/confirm-cash', requireAuth, handleConfirmCashPayment);

export default router;
