import { login, register } from '../services/auth.service.js';
import { assertRegister, assertLogin } from '../utils/validator.js';
import { updateMe } from '../services/user.service.js';
import { sendEmail } from '../email/sparkpost.js';
import { welcomeEmail } from '../email/templates.js';

export async function handleRegister(req, res, next) {
  try {
    assertRegister(req.body);
    const { name, email, phone, password, role } = req.body;
    // Chỉ kiểm tra email, gửi OTP, không tạo user
    const result = await register({ name, email, phone, password, roleName: role, verified: false });
    // Nếu verified=false thì chỉ trả message, nếu verified=true thì trả user+token
    if (result.user && result.token) {
      const { user, token } = result;
      res.status(201).json({
        ok: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role_id: user.role_id,
            role_name: user.role_name
          },
          token
        }
      });
    } else {
      res.status(200).json({ ok: true, message: 'Vui lòng xác thực email bằng OTP gửi về mail.' });
    }
  } catch (e) {
    next(e);
  }
}

export async function handleLogin(req, res, next) {
  try {
    assertLogin(req.body);
    const { email, password } = req.body;
    const result = await login({ email, password });
    const { user, token } = result;
    res.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id,
          role_name: user.role_name
        },
        token
      }
    });
  } catch (e) {
    next(e);
  }
}

export async function handleMe(req, res) {
  const user = req.user;
  res.json({
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.role_name
    }
  });
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
