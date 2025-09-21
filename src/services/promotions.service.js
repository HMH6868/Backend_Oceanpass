import { query } from '../db.js';

/**
 * Lấy danh sách promotions (đúng theo schema):
 *  - Tìm theo q trên code/name
 *  - Lọc activeOnly: is_active = true
 *  - Lọc nowOnly: valid_from <= now <= valid_to
 *  - Phân trang page/pageSize
 *
 * Schema cột (theo oceanpass.sql):
 *  id, code, name, description, type, value, min_amount, max_discount,
 *  valid_from, valid_to, is_active
 */
export async function listPromotions({ page = 1, pageSize = 10, q, activeOnly, nowOnly }) {
  const where = [];
  const params = [];
  let i = 1;

  // Tìm theo code/name
  if (q && q.trim() !== '') {
    where.push(`(code ILIKE $${i} OR name ILIKE $${i})`);
    params.push(`%${q.trim()}%`);
    i++;
  }

  if (activeOnly === true) {
    where.push(`is_active = true`);
  }

  if (nowOnly === true) {
    where.push(`(valid_from <= NOW() AND valid_to >= NOW())`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Đếm tổng
  const countSQL = `SELECT COUNT(*)::int AS total FROM promotions ${whereSQL}`;
  const countRes = await query(countSQL, params);
  const total = countRes.rows[0]?.total ?? 0;

  // Phân trang
  const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const offset = Math.max(0, (Number(page) - 1) * limit);

  // Lấy dữ liệu (CHỈ chọn các cột có thật)
  const dataSQL = `
    SELECT
      id, code, name, description,
      type, value, min_amount, max_discount,
      valid_from, valid_to, is_active
    FROM promotions
    ${whereSQL}
    ORDER BY valid_from DESC NULLS LAST
    LIMIT $${i} OFFSET $${i + 1}
  `;
  const dataRes = await query(dataSQL, [...params, limit, offset]);

  return {
    page: Number(page),
    pageSize: limit,
    total,
    items: dataRes.rows,
  };
}
