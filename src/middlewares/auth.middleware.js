import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // tải user (ẩn password_hash)
  const sql = `SELECT u.id, u.name, u.email, u.phone, u.role_id, r.name AS role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`;
  const rs = await query(sql, [payload.sub]);
    if (rs.rowCount === 0) return res.status(401).json({ ok: false, message: 'User not found' });

    req.user = rs.rows[0];
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
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