import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const roleIdByNameSQL = `
  SELECT id FROM roles WHERE name = $1
`;
const findUserByEmailSQL = `
  SELECT u.id, u.name, u.email, u.phone, u.password_hash, u.role_id, u.avatar, r.name as role_name
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.email = $1
`;
const insertUserSQL = `
  INSERT INTO users (id, name, email, phone, password_hash, role_id)
  VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
  RETURNING id, name, email, phone, role_id, avatar
`;

const findUserByPhoneSQL = `
  SELECT id FROM users WHERE phone = $1
`;

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

export async function register({ name, email, phone, password, roleName, verified }) {
  // Nếu chưa verified (OTP), chỉ kiểm tra email tồn tại, không tạo user
  if (!verified) {
    const existed = await query(findUserByEmailSQL, [email]);
    if (existed.rowCount > 0) {
      const err = new Error('Email đã tồn tại');
      err.status = 409;
      throw err;
    }
    if (phone) {
      const existedPhone = await query(findUserByPhoneSQL, [phone]);
      if (existedPhone.rowCount > 0) {
        const err = new Error('Số điện thoại đã tồn tại');
        err.status = 409;
        throw err;
      }
    }
    // Không tạo user, chỉ trả về ok để gửi OTP
    return { message: 'OTP sent' };
  }

  // verified=true: tạo user thật sự
  const existed = await query(findUserByEmailSQL, [email]);
  if (existed.rowCount > 0) {
    const err = new Error('Email đã tồn tại');
    err.status = 409;
    throw err;
  }
  if (phone) {
    const existedPhone = await query(findUserByPhoneSQL, [phone]);
    if (existedPhone.rowCount > 0) {
      const err = new Error('Số điện thoại đã tồn tại');
      err.status = 409;
      throw err;
    }
  }
  const role = roleName || process.env.DEFAULT_ROLE || 'customer';
  const roleRes = await query(roleIdByNameSQL, [role]);
  if (roleRes.rowCount === 0) {
    const err = new Error('Role không hợp lệ');
    err.status = 400;
    throw err;
  }
  const roleId = roleRes.rows[0].id;
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const ins = await query(insertUserSQL, [name, email, phone || null, passwordHash, roleId]);
  const user = ins.rows[0];
  const token = signToken({ sub: user.id, roleId: user.role_id });
  
  // Lấy role_name từ database
  const roleNameRes = await query('SELECT name FROM roles WHERE id = $1', [user.role_id]);
  const userRoleName = roleNameRes.rows[0]?.name;
  
  return { user: { ...user, role_name: userRoleName }, token };
}

export async function login({ email, password }) {
  const res = await query(findUserByEmailSQL, [email]);
  if (res.rowCount === 0) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.status = 401;
    throw err;
  }
  const u = res.rows[0];
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.status = 401;
    throw err;
  }
  const token = signToken({ sub: u.id, roleId: u.role_id });
  // Ẩn hash trước khi trả
  delete u.password_hash;
  return { user: u, token };
}
