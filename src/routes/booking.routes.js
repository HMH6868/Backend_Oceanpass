import { Router } from 'express';
import {
  handleAddPassengers,
  handleApplyPromotion,
  handleConfirmCashPayment,
  handleCreateBooking,
  handleGetBooking,
  handleGetBookingFullDetails 
} from '../controllers/booking.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint để tạo một đơn hàng mới (bước giữ ghế)
// requireAuth ở đây là optional, nên ta custom middleware để nó không báo lỗi nếu chưa có token
const optionalAuth = (req, res, next) => {
  // Tạm thời cho phép không cần đăng nhập, bạn có thể chỉnh lại sau
  next();
};

router.post('/', optionalAuth, handleCreateBooking);

// Endpoint để lấy thông tin chi tiết của một đơn hàng
router.get('/:id', handleGetBooking);
router.patch('/:id/promotion', handleApplyPromotion);
router.post('/:id/passengers', handleAddPassengers);
router.get('/:id/full-details', handleGetBookingFullDetails);


// dùng cho thanh toán bằng tiền mặt
router.post('/:id/confirm-cash', requireAuth, handleConfirmCashPayment);

export default router;
