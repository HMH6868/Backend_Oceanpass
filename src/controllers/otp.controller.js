// src/controllers/otp.controller.js
import { setOtp, getOtp, clearOtp } from '../utils/otpCache.js';
import { sendEmail } from '../email/sparkpost.js';
import { otpTemplate } from '../email/templates.js';

// Gửi OTP về email
export async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw Object.assign(new Error('Thiếu email'), { status: 400 });
    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(email, otp, 300); // 5 phút
    // Gửi mail
    await sendEmail({
      to: email,
      subject: 'Mã xác thực đăng ký Oceanpass',
      text: `Mã OTP của bạn là: ${otp}`,
      html: otpTemplate(otp, req.body.name || email)
    });
    res.json({ ok: true, message: 'OTP đã gửi về email' });
  } catch (e) {
    next(e);
  }
}

// Xác thực OTP và tạo user
import { register } from '../services/auth.service.js';
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp, name, phone, password, role } = req.body;
    if (!email || !otp) throw Object.assign(new Error('Thiếu email/otp'), { status: 400 });
    const valid = getOtp(email);
    if (!valid || valid !== otp) throw Object.assign(new Error('OTP không hợp lệ hoặc đã hết hạn'), { status: 400 });
    clearOtp(email);
    // Tạo user (nếu chưa tồn tại)
    const result = await register({ name, email, phone, password, roleName: role, verified: true });
    res.status(201).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}
