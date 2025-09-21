import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const roleIdByNameSQL = `
  SELECT id FROM roles WHERE name = $1
`;
const findUserByEmailSQL = `
  SELECT id, name, email, phone, password_hash, role_id
  FROM users
  WHERE email = $1
`;
const insertUserSQL = `
  INSERT INTO users (id, name, email, phone, password_hash, role_id)
  VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
  RETURNING id, name, email, phone, role_id
`;

const findUserByPhoneSQL = `
  SELECT id FROM users WHERE phone = $1
`;

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

export async function register({ name, email, phone, password, roleName }) {
  // 1) email trùng?
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

  // 2) role: mặc định từ env (customer) nếu không truyền
  const role = roleName || process.env.DEFAULT_ROLE || 'customer';
  const roleRes = await query(roleIdByNameSQL, [role]);
  if (roleRes.rowCount === 0) {
    const err = new Error('Role không hợp lệ');
    err.status = 400;
    throw err;
  }
  const roleId = roleRes.rows[0].id;

  // 3) hash mật khẩu
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 4) insert
  const ins = await query(insertUserSQL, [name, email, phone || null, passwordHash, roleId]);
  const user = ins.rows[0];

  // 5) token
  const token = signToken({ sub: user.id, roleId: user.role_id });
  return { user, token };
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
