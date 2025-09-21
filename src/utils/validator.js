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
