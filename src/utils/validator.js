export function assertRegister(body) {
  const { name, email, phone, password } = body;
  if (!name || !email || !password) {
    const err = new Error('Thiếu name/email/password');
    err.status = 400;
    throw err;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Email không đúng định dạng');
    err.status = 400;
    throw err;
  }
  if (!phone || typeof phone !== 'string' || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
    const err = new Error('Số điện thoại phải là 10 chữ số');
    err.status = 400;
    throw err;
  }
}

export function assertLogin(body) {
  const { email, password } = body;
  if (!email || !password) {
    const err = new Error('Thiếu email/password');
    err.status = 400;
    throw err;
  }
}

export function assertUpdateProfile(body) {
  const { name, phone, email, password, role } = body;

  if (email !== undefined || password !== undefined || role !== undefined) {
    const err = new Error('Chỉ được cập nhật name và phone');
    err.status = 400;
    throw err;
  }

  if (name === undefined && phone === undefined) {
    const err = new Error('Cần cung cấp ít nhất name hoặc phone');
    err.status = 400;
    throw err;
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      const err = new Error('name phải là chuỗi 2–100 ký tự');
      err.status = 400;
      throw err;
    }
  }

  if (phone !== undefined) {
    if (!phone || typeof phone !== 'string' || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      const err = new Error('Số điện thoại phải là 10 chữ số');
      err.status = 400;
      throw err;
    }
  }
}
