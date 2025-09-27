import { query } from '../db.js';
import bcrypt from 'bcrypt';

const phoneExistsForAnotherUserSQL = `
  SELECT 1 FROM users
   WHERE phone = $1 AND id <> $2
   LIMIT 1
`;

export async function updateMe(userId, { name, phone, avatar }) {
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
    const normalizedPhone = phone === '' ? null : phone.trim();
    sets.push(`phone = $${i++}`);
    vals.push(normalizedPhone);
  }
  if (avatar !== undefined) {
    sets.push(`avatar = $${i++}`);
    vals.push(avatar);
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
     RETURNING id, name, email, phone, role_id, avatar
  `;
  vals.push(userId);

  const rs = await query(sql, vals);
  if (rs.rowCount === 0) {
    const err = new Error('User không tồn tại');
    err.status = 404;
    throw err;
  }
  
  const user = rs.rows[0];
  
  // Lấy role_name từ database
  const roleRes = await query('SELECT name FROM roles WHERE id = $1', [user.role_id]);
  const userRoleName = roleRes.rows[0]?.name;
  
  return { ...user, role_name: userRoleName };
}


/**
 * Cập nhật chỉ avatar cho người dùng.
 * @param {string} userId - ID của người dùng
 * @param {string} avatarUrl - URL avatar mới
 * @returns {Promise<object>} Thông tin người dùng đã được cập nhật
 */
export async function updateUserAvatar(userId, avatarUrl) {
  const sql = `
    UPDATE users
    SET avatar = $1
    WHERE id = $2
    RETURNING id, name, email, phone, role_id, avatar;
  `;

  const { rows } = await query(sql, [avatarUrl, userId]);

  if (rows.length === 0) {
    const err = new Error('User không tồn tại');
    err.status = 404;
    throw err;
  }

  return rows[0];
}


/**
 * Thay đổi mật khẩu cho người dùng đã đăng nhập.
 * @param {string} userId ID của người dùng
 * @param {string} currentPassword Mật khẩu hiện tại
 * @param {string} newPassword Mật khẩu mới
 */
export async function changeUserPassword(userId, currentPassword, newPassword) {
  // B1: Lấy mật khẩu đã hash của người dùng từ DB
  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (userResult.rowCount === 0) {
    const err = new Error('User không tồn tại');
    err.status = 404;
    throw err;
  }
  const storedHash = userResult.rows[0].password_hash;

  // B2: So sánh mật khẩu hiện tại người dùng nhập với hash trong DB
  const isMatch = await bcrypt.compare(currentPassword, storedHash);
  if (!isMatch) {
    const err = new Error('Mật khẩu hiện tại không đúng');
    err.status = 401; // Unauthorized
    throw err;
  }

  // B3: Băm mật khẩu mới
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // B4: Cập nhật mật khẩu mới vào DB
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
}