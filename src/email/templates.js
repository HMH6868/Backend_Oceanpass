// Template email gửi OTP xác thực tài khoản
export const otpTemplate = (otp, userName) =>  `
 <div style="max-width:480px;margin:0 auto;padding:24px;background:#fff;border:1px solid #e3e8ee;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://img.icons8.com/color/96/000000/verified-account.png" alt="OTP" style="width:64px;height:64px;">
    </div>
    <h2 style="color:#1976D2;text-align:center;margin-bottom:8px;">Xác thực tài khoản</h2>
    <p style="text-align:center;color:#333;font-size:16px;">Xin chào <strong>${userName}</strong>,</p>
    <p style="text-align:center;color:#555;font-size:15px;margin-bottom:24px;">Cảm ơn bạn đã đăng ký tài khoản. Mã OTP của bạn là:</p>
    <div style="background-color:#1976D2;color:#fff;padding:18px 0;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 auto 20px auto;width:80%;">
      ${otp}
    </div>
    <p style="text-align:center;color:#888;font-size:14px;margin-bottom:8px;">Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
    <p style="text-align:center;color:#888;font-size:14px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
    <hr style="border:none;border-top:1px solid #e3e8ee;margin:32px 0 16px 0;">
    <p style="color:#b0b0b0;font-size:12px;text-align:center;">
      Đây là email tự động, vui lòng không trả lời email này.<br>
      <span style="font-size:11px;">&copy; OceanPass</span>
    </p>
    <div style="text-align:center;color:#bbb;font-size:11px;margin-top:12px;">Powered by OceanPass</div>
  </div>
`;
export function welcomeEmail({ name, loginUrl = 'https://oceanpass.tech' }) {
  const safeName = name?.trim() || 'bạn';
  const subject = 'Chào mừng đến OceanPass ';
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:auto;text-align:center">
      <h2>Xin chào ${safeName},</h2>
      <p>Tài khoản của bạn đã được tạo thành công.</p>
      <div>
        <a href="${loginUrl}" style="display:inline-block;padding:8px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px">Truy cập web</a>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#6b7280;font-size:12px">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.</p>
    </div>
  `;
  const text = `Xin chào ${safeName}, tài khoản của bạn đã được tạo. Đăng nhập: ${loginUrl}`;
  return { subject, html, text };
}
