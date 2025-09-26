import short from 'short-uuid';
import { pool } from '../db.js';
import * as promotionsService from './promotions.service.js';

const translator = short();

/**
 * Tính toán tổng tiền dựa trên danh sách ghế và loại hành khách.
 * @param {Array} seats - [{ seatId: '...', type: 'adult' | 'child' }]
 * @returns {Promise<number>} - Tổng số tiền
 */
async function calculateTotalAmount(seats, client) {
  if (!seats || seats.length === 0) return 0;

  const seatIds = seats.map((s) => s.seatId);
  const queryRunner = client || pool;

  const { rows } = await queryRunner.query(
    `SELECT id, adult_price, child_price FROM seats WHERE id = ANY($1::varchar[])`,
    [seatIds]
  );

  let total = 0;
  const priceMap = new Map(rows.map((row) => [row.id, row]));

  for (const seat of seats) {
    const priceInfo = priceMap.get(seat.seatId);
    if (priceInfo) {
      total +=
        seat.type === 'adult' ? Number(priceInfo.adult_price) : Number(priceInfo.child_price);
    }
  }
  return total;
}

/**
 * Tạo một đơn hàng mới ở trạng thái 'pending' và giữ chỗ các ghế đã chọn.
 * (ĐÃ NÂNG CẤP ĐỂ XỬ LÝ KHỨ HỒI)
 * @param {object} bookingData - Dữ liệu đơn hàng
 * @returns {Promise<object>} - Chi tiết đơn hàng vừa tạo
 */
export async function createPendingBooking(bookingData) {
  const { userId, tripType } = bookingData;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    let outboundScheduleId, returnScheduleId;

    const bookingCode = `OCEAN-${translator.new().toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // Xử lý chuyến đi (bắt buộc)
    if (tripType === 'round-trip') {
      outboundScheduleId = bookingData.departureScheduleId;
      const departureSeats = bookingData.departureSeats;

      // Kiểm tra và giữ chỗ ghế chiều đi
      for (const seat of departureSeats) {
        const { rows } = await client.query(
          `SELECT 1 FROM schedule_seat_status WHERE schedule_id = $1 AND seat_id = $2`,
          [outboundScheduleId, seat.seatId]
        );
        if (rows.length > 0)
          throw Object.assign(new Error(`Ghế ${seat.seatId} ở chiều đi đã có người chọn.`), {
            status: 409,
          });
      }
      totalAmount += await calculateTotalAmount(departureSeats, client);
    } else {
      // one-way
      outboundScheduleId = bookingData.scheduleId;
      const seats = bookingData.seats;

      // Kiểm tra và giữ chỗ ghế
      for (const seat of seats) {
        const { rows } = await client.query(
          `SELECT 1 FROM schedule_seat_status WHERE schedule_id = $1 AND seat_id = $2`,
          [outboundScheduleId, seat.seatId]
        );
        if (rows.length > 0)
          throw Object.assign(new Error(`Ghế ${seat.seatId} đã có người chọn.`), { status: 409 });
      }
      totalAmount += await calculateTotalAmount(seats, client);
    }

    // Xử lý chuyến về (nếu có)
    if (tripType === 'round-trip') {
      returnScheduleId = bookingData.returnScheduleId;
      const returnSeats = bookingData.returnSeats;

      // Kiểm tra và giữ chỗ ghế chiều về
      for (const seat of returnSeats) {
        const { rows } = await client.query(
          `SELECT 1 FROM schedule_seat_status WHERE schedule_id = $1 AND seat_id = $2`,
          [returnScheduleId, seat.seatId]
        );
        if (rows.length > 0)
          throw Object.assign(new Error(`Ghế ${seat.seatId} ở chiều về đã có người chọn.`), {
            status: 409,
          });
      }
      totalAmount += await calculateTotalAmount(returnSeats, client);
    }

    // Tạo đơn hàng mới trong DB
    const bookingResult = await client.query(
      `INSERT INTO bookings (id, code, user_id, trip_type, outbound_schedule_id, return_schedule_id, total_amount, final_amount, status, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending', $8) RETURNING *`,
      [
        bookingCode,
        userId,
        tripType,
        outboundScheduleId,
        returnScheduleId || null,
        totalAmount,
        totalAmount,
        expiresAt,
      ]
    );
    const newBooking = bookingResult.rows[0];

    // "Giữ chỗ" (reserve) các ghế
    if (tripType === 'round-trip') {
      for (const seat of bookingData.departureSeats) {
        await client.query(
          `INSERT INTO schedule_seat_status (schedule_id, seat_id, booking_id, status, reserved_until) VALUES ($1, $2, $3, 'reserved', $4)`,
          [outboundScheduleId, seat.seatId, newBooking.id, expiresAt]
        );
      }
      for (const seat of bookingData.returnSeats) {
        await client.query(
          `INSERT INTO schedule_seat_status (schedule_id, seat_id, booking_id, status, reserved_until) VALUES ($1, $2, $3, 'reserved', $4)`,
          [returnScheduleId, seat.seatId, newBooking.id, expiresAt]
        );
      }
    } else {
      for (const seat of bookingData.seats) {
        await client.query(
          `INSERT INTO schedule_seat_status (schedule_id, seat_id, booking_id, status, reserved_until) VALUES ($1, $2, $3, 'reserved', $4)`,
          [outboundScheduleId, seat.seatId, newBooking.id, expiresAt]
        );
      }
    }

    await client.query('COMMIT');
    return newBooking;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
/**
 * Lấy chi tiết một đơn hàng bằng ID (đã cập nhật để thêm thông tin chuyến đi)
 */
export async function getBookingDetails(bookingId) {
  const query = `
        SELECT 
            b.*, -- Lấy tất cả thông tin từ đơn hàng
            p.code as "promotionCode", -- Lấy mã code từ bảng promotions
            
            -- Lấy thông tin các ghế đã chọn
            (SELECT json_agg(
                json_build_object(
                    'seat_id', sss.seat_id,
                    'status', sss.status,
                    'seat_number', s.seat_number
                )
            )
            FROM schedule_seat_status sss
            JOIN seats s ON sss.seat_id = s.id
            WHERE sss.booking_id = b.id
            ) as seats,
            
            -- Lấy thông tin chi tiết của chuyến đi
            json_build_object(
                'schedule_id', sch.id,
                'departure_time', sch.departure_time,
                'arrival_time', sch.arrival_time,
                'vessel_name', v.name,
                'from_port_name', p_from.name,
                'to_port_name', p_to.name
            ) as schedule_info

        FROM 
            bookings b
        -- JOIN các bảng liên quan để lấy thông tin chuyến đi
        JOIN schedules sch ON b.outbound_schedule_id = sch.id
        JOIN vessels v ON sch.vessel_id = v.id
        JOIN routes r ON sch.route_id = r.id
        JOIN ports p_from ON r.from_port_id = p_from.id
        JOIN ports p_to ON r.to_port_id = p_to.id
        -- LEFT JOIN với bảng promotions để lấy mã code
        LEFT JOIN promotions p ON b.promotion_id = p.id
        WHERE 
            b.id = $1
    `;

  const { rows } = await pool.query(query, [bookingId]);

  if (rows.length === 0) {
    throw Object.assign(new Error('Booking not found'), { status: 404 });
  }
  return rows[0];
}

/**
 * Hủy các đơn hàng pending đã hết hạn.
 */
export async function expirePendingBookings() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tìm các booking đã hết hạn
    const expiredBookingsResult = await client.query(
      `SELECT id FROM bookings WHERE status = 'pending' AND expires_at < NOW()`
    );
    const expiredBookingIds = expiredBookingsResult.rows.map((b) => b.id);

    if (expiredBookingIds.length > 0) {
      console.log(`[CronJob] Found ${expiredBookingIds.length} expired bookings. Cleaning up...`);

      // 1. Xóa các ghế đã giữ
      await client.query(
        `DELETE FROM schedule_seat_status WHERE booking_id = ANY($1::varchar[]) AND status = 'reserved'`,
        [expiredBookingIds]
      );

      // 2. Cập nhật trạng thái booking thành 'expired'
      await client.query(`UPDATE bookings SET status = 'expired' WHERE id = ANY($1::varchar[])`, [
        expiredBookingIds,
      ]);
    }

    await client.query('COMMIT');
    return expiredBookingIds.length;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CronJob] Error expiring bookings:', error);
  } finally {
    client.release();
  }
}

/**
 * Áp dụng mã khuyến mãi vào một đơn hàng đã tồn tại.
 * @param {string} bookingId ID của đơn hàng
 * @param {string} promotionCode Mã khuyến mãi
 * @returns {Promise<object>} Đơn hàng đã được cập nhật
 */
export async function applyPromotionToBooking(bookingId, promotionCode) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lấy thông tin booking hiện tại, đảm bảo nó chưa được xử lý
    const bookingRes = await client.query(
      `SELECT id, total_amount, status FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bookingRes.rowCount === 0) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
    }
    const booking = bookingRes.rows[0];

    // Kiểm tra lại mã khuyến mãi một lần nữa phía server để đảm bảo an toàn
    const promotionResult = await promotionsService.checkPromotion({
      code: promotionCode,
      total_amount: Number(booking.total_amount),
    });

    // Lấy promotion_id từ code
    const promoIdRes = await client.query('SELECT id FROM promotions WHERE code = $1', [
      promotionCode,
    ]);
    const promotionId = promoIdRes.rows[0]?.id;
    if (!promotionId) {
      throw Object.assign(new Error('Mã khuyến mãi không tồn tại'), { status: 404 });
    }

    // Cập nhật đơn hàng với thông tin giảm giá
    const updatedBookingRes = await client.query(
      `UPDATE bookings 
       SET discount_amount = $1, final_amount = $2, promotion_id = $3
       WHERE id = $4 RETURNING *`,
      [promotionResult.discount_amount, promotionResult.final_amount, promotionId, bookingId]
    );

    await client.query('COMMIT');
    return updatedBookingRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    // Ném lỗi ra ngoài để controller có thể bắt và xử lý
    if (error.status) throw error; // Giữ nguyên status code nếu có
    // Chuyển đổi lỗi từ service khuyến mãi sang lỗi của API này
    const newError = new Error(error.message);
    newError.status = 400; // Bad Request
    throw newError;
  } finally {
    client.release();
  }
}

/**
 * Thêm thông tin hành khách vào một đơn hàng.
 * @param {string} bookingId ID của đơn hàng
 * @param {Array} passengers Danh sách hành khách [{ name, dateOfBirth, cccdNumber }]
 * @returns {Promise<Array>} Danh sách hành khách vừa được thêm
 */
export async function addPassengersToBooking(bookingId, passengers) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kiểm tra số lượng hành khách không vượt quá số ghế đã đặt
    const seatCountRes = await client.query(
      `SELECT COUNT(*) FROM schedule_seat_status WHERE booking_id = $1`,
      [bookingId]
    );
    const seatCount = parseInt(seatCountRes.rows[0].count, 10);

    if (passengers.length > seatCount) {
      throw Object.assign(
        new Error(
          `Số lượng hành khách (${passengers.length}) không được vượt quá số ghế đã đặt (${seatCount}).`
        ),
        { status: 400 }
      );
    }

    const addedPassengers = [];
    for (const p of passengers) {
      // Tự động xác định loại hành khách (adult/child) dựa vào ngày sinh
      const today = new Date();
      const birthDate = new Date(p.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      const passengerType = age < 12 ? 'child' : 'adult';

      const passengerId = `PAX-${translator.new().toUpperCase()}`;

      const { rows } = await client.query(
        `INSERT INTO passengers (id, booking_id, name, date_of_birth, type, cccd_number)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [passengerId, bookingId, p.name, p.dateOfBirth, passengerType, p.cccdNumber || null]
      );
      addedPassengers.push(rows[0]);
    }

    await client.query('COMMIT');
    return addedPassengers;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Xác nhận thanh toán bằng tiền mặt (dành cho admin/staff).
 * (ĐÃ ĐƠN GIẢN HÓA - KHÔNG CẦN HỒ SƠ NHÂN VIÊN)
 * @param {string} bookingId ID của đơn hàng
 * @param {object} actor Thông tin người thực hiện (admin/staff) từ bảng users
 * @returns {Promise<object>}
 */
export async function confirmCashPayment(bookingId, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // BƯỚC TÌM KIẾM NHÂN VIÊN ĐÃ ĐƯỢC XÓA BỎ

    // 1. Lấy và khóa đơn hàng để xử lý
    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bookingRes.rowCount === 0) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng.'), { status: 404 });
    }
    const booking = bookingRes.rows[0];
    if (booking.status !== 'pending') {
      throw Object.assign(new Error(`Đơn hàng đã ở trạng thái ${booking.status}, không thể xác nhận.`), { status: 400 });
    }

    // 2. Cập nhật đơn hàng mà không cần created_by_employee_id
    // Cột created_by_employee_id sẽ được để là NULL
    await client.query(
      `UPDATE bookings 
       SET status = 'completed', payment_method = 'cash'
       WHERE id = $1`,
      [bookingId]
    );

    // Các bước 3, 4, 5, 6 (lấy hành khách, ghế và tạo vé) giữ nguyên
    // 3. Lấy danh sách hành khách của đơn hàng
    const passengersRes = await client.query(
      `SELECT * FROM passengers WHERE booking_id = $1`,
      [bookingId]
    );
    const passengers = passengersRes.rows;
    if (passengers.length === 0) {
        throw new Error('Đơn hàng chưa có thông tin hành khách.');
    }

    // 4. Lấy danh sách ghế đã giữ của đơn hàng
    const seatsRes = await client.query(
        `SELECT * FROM schedule_seat_status WHERE booking_id = $1`,
        [bookingId]
    );
    const reservedSeats = seatsRes.rows;

    // 5. Tạo vé cho từng hành khách
    for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        const seat = reservedSeats[i];
        const ticketId = `TICKET-${translator.new().toUpperCase()}`;
        
        const scheduleId = booking.outbound_schedule_id;

        await client.query(
            `INSERT INTO tickets (id, booking_id, schedule_id, passenger_id, seat_id, qr_code_data)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ticketId, bookingId, scheduleId, passenger.id, seat.seat_id, `${ticketId}|${passenger.name}`]
        );
    }

    // 6. Cập nhật trạng thái ghế từ 'reserved' thành 'booked'
    await client.query(
      `UPDATE schedule_seat_status SET status = 'booked', reserved_until = NULL WHERE booking_id = $1`,
      [bookingId]
    );

    await client.query('COMMIT');
    return { success: true, message: 'Xác nhận thanh toán và xuất vé thành công.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lấy TOÀN BỘ thông tin chi tiết của đơn hàng, bao gồm cả hành khách và vé.
 * @param {string} bookingId - ID của đơn hàng
 * @returns {Promise<object>} - Dữ liệu chi tiết của đơn hàng
 */
export async function getBookingFullDetails(bookingId) {
  const query = `
    SELECT 
        b.*, -- Lấy tất cả thông tin từ đơn hàng
        p_promo.code as "promotionCode", -- Lấy mã code từ bảng promotions
        
        -- Lấy thông tin chi tiết của chuyến đi
        json_build_object(
            'schedule_id', sch.id,
            'departure_time', sch.departure_time,
            'arrival_time', sch.arrival_time,
            'vessel_name', v.name,
            'from_port_name', p_from.name,
            'to_port_name', p_to.name
        ) as schedule_info,
        
        -- Lấy danh sách hành khách và vé tương ứng của họ
        (
            SELECT json_agg(
                json_build_object(
                    'passenger_id', p.id,
                    'name', p.name,
                    'date_of_birth', p.date_of_birth,
                    'type', p.type,
                    'cccd_number', p.cccd_number,
                    'ticket', (
                        SELECT json_build_object(
                            'ticket_id', t.id,
                            'seat_number', s.seat_number,
                            'qr_code_data', t.qr_code_data
                        )
                        FROM tickets t
                        JOIN seats s ON t.seat_id = s.id
                        WHERE t.passenger_id = p.id AND t.booking_id = b.id
                        LIMIT 1
                    )
                )
            )
            FROM passengers p
            WHERE p.booking_id = b.id
        ) as passengers

    FROM 
        bookings b
    -- JOIN các bảng liên quan
    JOIN schedules sch ON b.outbound_schedule_id = sch.id
    JOIN vessels v ON sch.vessel_id = v.id
    JOIN routes r ON sch.route_id = r.id
    JOIN ports p_from ON r.from_port_id = p_from.id
    JOIN ports p_to ON r.to_port_id = p_to.id
    LEFT JOIN promotions p_promo ON b.promotion_id = p_promo.id
    WHERE 
        b.id = $1
  `;

  const { rows } = await pool.query(query, [bookingId]);

  if (rows.length === 0) {
    throw Object.assign(new Error('Booking not found'), { status: 404 });
  }
  return rows[0];
}