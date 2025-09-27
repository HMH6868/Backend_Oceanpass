import jwt from 'jsonwebtoken'; // Thêm import này
import { login, register } from '../services/auth.service.js';
import { updateMe } from '../services/user.service.js';
import { addTokenToBlocklist } from '../utils/tokenBlocklist.js'; // Thêm import này
import { assertLogin, assertRegister } from '../utils/validator.js';

export async function handleRegister(req, res, next) {
  try {
    assertRegister(req.body);
    const { name, email, phone, password, role } = req.body;
    // Chỉ kiểm tra email, gửi OTP, không tạo user
    const result = await register({
      name,
      email,
      phone,
      password,
      roleName: role,
      verified: false,
    });
    res.status(200).json({ ok: true, message: 'Vui lòng xác thực email bằng OTP gửi về mail.' });
  } catch (e) {
    next(e);
  }
}

export async function handleLogin(req, res, next) {
  try {
    assertLogin(req.body);
    const { email, password } = req.body;
    const result = await login({ email, password });
    res.json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}

/**
 * Xử lý đăng xuất bằng cách thêm token vào denylist
 */
export async function handleLogout(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      // Giải mã token để lấy thời gian hết hạn (exp)
      const payload = jwt.decode(token);
      if (payload && payload.exp) {
        addTokenToBlocklist(token, payload.exp);
      }
    }

    res.status(200).json({ ok: true, message: 'Đăng xuất thành công.' });
  } catch (e) {
    next(e);
  }
}

export async function handleMe(req, res) {
  res.json({ ok: true, data: req.user });
}

export async function handleUpdateMe(req, res, next) {
  try {
    // Chỉ lấy name/phone – bỏ qua email nếu client cố tình gửi
    const { name, phone } = req.body || {};
    const updated = await updateMe(req.user.id, { name, phone });
    res.json({ ok: true, data: updated });
  } catch (e) {
    next(e);
  }
}
