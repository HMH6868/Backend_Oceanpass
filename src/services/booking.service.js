import { query } from '../db.js';

export async function getBookings() {
  const sql = `
    SELECT 
      b.id,
      b.code,
      b.trip_type,
      b.total_amount,
      b.discount_amount,
      b.final_amount,
      b.status,
      b.payment_method,
      b.created_at,
      b.updated_at,
      u.name as customer_name,
      u.email as customer_email,
      p.name as promotion_name
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN promotions p ON b.promotion_id = p.id
    ORDER BY b.created_at DESC
  `;
  
  const result = await query(sql);
  return result.rows;
}

export async function createBooking(bookingData) {
  const {
    code,
    user_id,
    trip_type,
    outbound_schedule_id,
    return_schedule_id,
    total_amount,
    discount_amount,
    final_amount,
    promotion_id,
    status = 'pending',
    payment_method
  } = bookingData;

  const sql = `
    INSERT INTO bookings (
      id, code, user_id, trip_type, outbound_schedule_id, return_schedule_id,
      total_amount, discount_amount, final_amount, promotion_id, status, payment_method
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *
  `;

  const bookingId = `BK${Date.now()}`;
  const values = [
    bookingId, code, user_id, trip_type, outbound_schedule_id, return_schedule_id,
    total_amount, discount_amount, final_amount, promotion_id, status, payment_method
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

export async function updateBooking(bookingId, updateData) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const sql = `
    UPDATE bookings 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
    RETURNING *
  `;

  values.push(bookingId);
  const result = await query(sql, values);
  
  if (result.rows.length === 0) {
    throw new Error('Booking not found');
  }

  return result.rows[0];
}

export async function deleteBooking(bookingId) {
  const sql = 'DELETE FROM bookings WHERE id = $1';
  const result = await query(sql, [bookingId]);
  
  if (result.rowCount === 0) {
    throw new Error('Booking not found');
  }
}
