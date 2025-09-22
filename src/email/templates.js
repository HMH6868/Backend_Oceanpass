export function welcomeEmail({ name, loginUrl = 'https://oceanpass.tech' }) {
  const safeName = name?.trim() || 'bạn';
  const subject = 'Chào mừng đến OceanPass 🚢';
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
