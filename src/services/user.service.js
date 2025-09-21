import { query } from '../db.js';

const phoneExistsForAnotherUserSQL = `
  SELECT 1 FROM users
   WHERE phone = $1 AND id <> $2
   LIMIT 1
`;

export async function updateMe(userId, { name, phone }) {
  // Kiểm tra trùng phone nếu client gửi phone
  if (phone !== undefined && phone !== null && phone.trim() !== '') {
    const dupe = await query(phoneExistsForAnotherUserSQL, [phone.trim(), userId]);
    if (dupe.rowCount > 0) {
      const err = new Error('Số điện thoại đã tồn tại');
      err.status = 409;
      throw err;
    }
  }

  const sets = [];
  const vals = [];
  let i = 1;

  if (name !== undefined) {
    sets.push(`name = $${i++}`);
    vals.push(name.trim());
  }
  if (phone !== undefined) {
    // cho phép null/empty? ở đây chuẩn hoá về null nếu chuỗi rỗng
    const normalizedPhone = phone === '' ? null : phone.trim();
    sets.push(`phone = $${i++}`);
    vals.push(normalizedPhone);
  }

  if (sets.length === 0) {
    const err = new Error('Không có trường nào để cập nhật');
    err.status = 400;
    throw err;
  }

  const sql = `
    UPDATE users
       SET ${sets.join(', ')}
     WHERE id = $${i}
     RETURNING id, name, email, phone, role_id
  `;
  vals.push(userId);

  const rs = await query(sql, vals);
  if (rs.rowCount === 0) {
    const err = new Error('User không tồn tại');
    err.status = 404;
    throw err;
  }
  return rs.rows[0];
}
