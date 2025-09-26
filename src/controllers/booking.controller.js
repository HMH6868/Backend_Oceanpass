import * as bookingService from '../services/booking.service.js';

/**
 * Xử lý yêu cầu tạo đơn hàng pending
 */
export async function handleCreateBooking(req, res, next) {
  try {
    const { tripType } = req.body;
    const userId = req.user ? req.user.id : null;
    let bookingData;

    if (tripType === 'round-trip') {
      const { departureScheduleId, returnScheduleId, departureSeats, returnSeats } = req.body;
      if (!departureScheduleId || !returnScheduleId || !departureSeats || !returnSeats) {
        const err = new Error('Vui lòng cung cấp đủ thông tin cho chuyến đi và về.');
        err.status = 400;
        throw err;
      }
      bookingData = {
        userId,
        tripType,
        departureScheduleId,
        returnScheduleId,
        departureSeats,
        returnSeats,
      };
    } else {
      // Mặc định là 'one-way'
      const { scheduleId, seats } = req.body;
      if (!scheduleId || !seats || !Array.isArray(seats) || seats.length === 0) {
        const err = new Error('Vui lòng cung cấp scheduleId và danh sách ghế.');
        err.status = 400;
        throw err;
      }
      bookingData = { userId, tripType: 'one-way', scheduleId, seats };
    }

    const newBooking = await bookingService.createPendingBooking(bookingData);
    res.status(201).json({ ok: true, data: newBooking });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý yêu cầu lấy chi tiết đơn hàng
 */
export async function handleGetBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingDetails(id);
    res.status(200).json({ ok: true, data: booking });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý yêu cầu áp dụng mã khuyến mãi vào đơn hàng
 */
export async function handleApplyPromotion(req, res, next) {
  try {
    const { id } = req.params;
    const { promotionCode } = req.body;

    if (!promotionCode) {
      const err = new Error('Vui lòng cung cấp promotionCode.');
      err.status = 400;
      throw err;
    }

    const updatedBooking = await bookingService.applyPromotionToBooking(id, promotionCode);
    res.status(200).json({ ok: true, data: updatedBooking });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý yêu cầu thêm thông tin hành khách vào đơn hàng
 */
export async function handleAddPassengers(req, res, next) {
  try {
    const { id } = req.params;
    const { passengers } = req.body;

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      const err = new Error('Vui lòng cung cấp danh sách hành khách.');
      err.status = 400;
      throw err;
    }

    // (Nâng cao) Ở đây bạn có thể thêm validation chi tiết cho từng hành khách
    // Ví dụ: kiểm tra tên, định dạng ngày sinh...

    const result = await bookingService.addPassengersToBooking(id, passengers);
    res.status(201).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý xác nhận thanh toán bằng tiền mặt
 */
export async function handleConfirmCashPayment(req, res, next) {
  try {
    // Middleware requireAuth đã thêm req.user
    const actor = req.user; 
    
    // Kiểm tra quyền: chỉ admin (1) hoặc staff (2)
    if (!actor || ![1, 2].includes(actor.role_id)) {
      const err = new Error('Forbidden: Bạn không có quyền thực hiện hành động này.');
      err.status = 403;
      throw err;
    }

    const { id } = req.params;
    const result = await bookingService.confirmCashPayment(id, actor);
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function handleGetBookingFullDetails(req, res, next) {
  try {
    const { id } = req.params;
    const bookingDetails = await bookingService.getBookingFullDetails(id);
    res.status(200).json({ ok: true, data: bookingDetails });
  } catch (e) {
    next(e);
  }
}