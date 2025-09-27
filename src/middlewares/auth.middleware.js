import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { isTokenBlocklisted } from '../utils/tokenBlocklist.js'; 
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: 'Missing token' });

    // *** Bước 1: Kiểm tra xem token có trong denylist không ***
    if (isTokenBlocklisted(token)) {
      return res.status(401).json({ ok: false, message: 'Token has been invalidated' });
    }

    // Bước 2: Xác thực token như bình thường
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Tải user (bao gồm cả avatar, ẩn password_hash)
    const sql = `
      SELECT u.id, u.name, u.email, u.phone, u.role_id, u.avatar, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;
    const rs = await query(sql, [payload.sub]);
    if (rs.rowCount === 0) return res.status(401).json({ ok: false, message: 'User not found' });

    req.user = rs.rows[0];
    next();
  } catch (e) {
    // Phân biệt lỗi token không hợp lệ và các lỗi khác
    if (e instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
    next(e); // Chuyển các lỗi khác cho error handler
  }
}

export const checkAdminRole = (req, res, next) => {
  // Middleware này phải được dùng SAU `requireAuth`
  const user = req.user;

  if (!user || (user.role_id !== 1 && user.role_id !== 2)) {
    return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
  }

  next();
};
