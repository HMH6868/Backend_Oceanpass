import { login, register } from '../services/auth.service.js';
import { updateMe } from '../services/user.service.js';

export async function handleRegister(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;
    const result = await register({ name, email, phone, password, roleName: role });
    res.status(201).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });
    res.json({ ok: true, data: result });
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
