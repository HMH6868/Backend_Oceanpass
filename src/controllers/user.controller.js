import { updateMe } from '../services/user.service.js';

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
