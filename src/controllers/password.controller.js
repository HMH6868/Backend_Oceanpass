import { getOtp, setOtp, clearOtp } from '../utils/otpCache.js';
import { sendEmail } from '../email/sparkpost.js';
import { query } from '../db.js';
import bcrypt from 'bcrypt';
import { otpTemplate } from '../email/templates.js';

// Gửi OTP reset password
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw Object.assign(new Error('Thiếu email'), { status: 400 });
    const userRes = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' });
    const user = userRes.rows[0];
    // Tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(email, otp, 300); // 5 phút
    // Gửi mail
    await sendEmail({
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu Oceanpass',
      text: `Mã OTP đặt lại mật khẩu của bạn là: ${otp}`,
      html: otpTemplate(otp, user.name || email)
    });
    res.json({ ok: true, message: 'OTP đặt lại mật khẩu đã gửi về email' });
  } catch (e) {
    next(e);
  }
}

// Xác thực OTP và cập nhật password mới
export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) throw Object.assign(new Error('Thiếu thông tin'), { status: 400 });
    const valid = getOtp(email);
    if (!valid || valid !== otp) return res.status(400).json({ ok: false, message: 'OTP không hợp lệ hoặc đã hết hạn' });
    clearOtp(email);
    // Hash password mới
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    // Update password
    const up = await query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id', [passwordHash, email]);
    if (up.rowCount === 0) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' });
    res.json({ ok: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (e) {
    next(e);
  }
}
