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

// Hàm tạo mã khuyến mãi 
export function assertCreatePromotion(body) {
  const {
    code, name, description,
    type, value, min_amount, max_discount,
    valid_from, valid_to, is_active
  } = body || {};

  if (!code || typeof code !== 'string' || code.trim().length < 3 || code.trim().length > 64) {
    const err = new Error('code bắt buộc (3–64 ký tự)');
    err.status = 400; throw err;
  }
  if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 200) {
    const err = new Error('name bắt buộc (3–200 ký tự)');
    err.status = 400; throw err;
  }
  if (!type || !['percentage','fixed'].includes(type)) {
    const err = new Error("type phải là 'percentage' hoặc 'fixed'");
    err.status = 400; throw err;
  }
  const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  const vValue = num(value);
  if (vValue === null || Number.isNaN(vValue) || vValue <= 0) {
    const err = new Error('value phải là số > 0');
    err.status = 400; throw err;
  }
  if (type === 'percentage' && vValue > 100) {
    const err = new Error('value (%) tối đa 100');
    err.status = 400; throw err;
  }
  const vMin = num(min_amount);
  if (vMin !== null && (Number.isNaN(vMin) || vMin < 0)) {
    const err = new Error('min_amount phải là số ≥ 0 hoặc null');
    err.status = 400; throw err;
  }
  const vCap = num(max_discount);
  if (vCap !== null && (Number.isNaN(vCap) || vCap < 0)) {
    const err = new Error('max_discount phải là số ≥ 0 hoặc null');
    err.status = 400; throw err;
  }

  // kiểm tra thời gian (cho phép null)
  const from = valid_from ? new Date(valid_from) : null;
  const to   = valid_to   ? new Date(valid_to)   : null;
  if (from && isNaN(from.getTime())) { const err = new Error('valid_from không hợp lệ'); err.status = 400; throw err; }
  if (to   && isNaN(to.getTime()))   { const err = new Error('valid_to không hợp lệ');   err.status = 400; throw err; }
  if (from && to && from > to) {
    const err = new Error('valid_from phải ≤ valid_to');
    err.status = 400; throw err;
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    const err = new Error('is_active phải là boolean');
    err.status = 400; throw err;
  }

  // description optional: giới hạn độ dài nếu có
  if (description !== undefined && typeof description !== 'string') {
    const err = new Error('description phải là chuỗi');
    err.status = 400; throw err;
  }
}

// Cập nhật mã khuyến mãi
export function assertUpdatePromotion(body) {
  if (!body || typeof body !== 'object') {
    const err = new Error('Body không hợp lệ'); err.status = 400; throw err;
  }

  const allowed = ['code','name','description','type','value','min_amount','max_discount','valid_from','valid_to','is_active'];
  const keys = Object.keys(body);
  if (keys.length === 0) { const err = new Error('Không có trường nào để cập nhật'); err.status = 400; throw err; }

  // chặn field lạ
  for (const k of keys) {
    if (!allowed.includes(k)) {
      const err = new Error(`Trường không được phép: ${k}`); err.status = 400; throw err;
    }
  }

  if (body.code !== undefined) {
    if (typeof body.code !== 'string' || body.code.trim().length < 3 || body.code.trim().length > 64) {
      const err = new Error('code phải là chuỗi 3–64 ký tự'); err.status = 400; throw err;
    }
  }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 3 || body.name.trim().length > 200) {
      const err = new Error('name phải là chuỗi 3–200 ký tự'); err.status = 400; throw err;
    }
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    const err = new Error('description phải là chuỗi'); err.status = 400; throw err;
  }
  if (body.type !== undefined && !['percentage','fixed'].includes(body.type)) {
    const err = new Error("type phải là 'percentage' hoặc 'fixed'"); err.status = 400; throw err;
  }
  if (body.value !== undefined) {
    const v = Number(body.value);
    if (!Number.isFinite(v) || v <= 0) { const err = new Error('value phải là số > 0'); err.status = 400; throw err; }
    if (body.type === 'percentage' && v > 100) { const err = new Error('value (%) tối đa 100'); err.status = 400; throw err; }
  }
  if (body.min_amount !== undefined) {
    const v = Number(body.min_amount);
    if (!Number.isFinite(v) || v < 0) { const err = new Error('min_amount phải là số ≥ 0'); err.status = 400; throw err; }
  }
  if (body.max_discount !== undefined) {
    const v = Number(body.max_discount);
    if (!Number.isFinite(v) || v < 0) { const err = new Error('max_discount phải là số ≥ 0'); err.status = 400; throw err; }
  }
  if (body.valid_from !== undefined) {
    const d = new Date(body.valid_from);
    if (isNaN(d.getTime())) { const err = new Error('valid_from không hợp lệ'); err.status = 400; throw err; }
  }
  if (body.valid_to !== undefined) {
    const d = new Date(body.valid_to);
    if (isNaN(d.getTime())) { const err = new Error('valid_to không hợp lệ'); err.status = 400; throw err; }
  }
  if (body.valid_from && body.valid_to) {
    const from = new Date(body.valid_from); const to = new Date(body.valid_to);
    if (from > to) { const err = new Error('valid_from phải ≤ valid_to'); err.status = 400; throw err; }
  }
  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    const err = new Error('is_active phải là boolean'); err.status = 400; throw err;
  }
}

// Tạo cảng 
export function assertCreatePort(body) {
  const { id, name, code, city, address, latitude, longitude } = body || {};
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    const e = new Error('name bắt buộc (>=2 ký tự)'); e.status = 400; throw e;
  }
  if (!code || typeof code !== 'string' || code.trim().length < 2 || code.trim().length > 10) {
    const e = new Error('code bắt buộc (2–10 ký tự)'); e.status = 400; throw e;
  }
  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    const e = new Error('city bắt buộc'); e.status = 400; throw e;
  }
  if (latitude === undefined || longitude === undefined) {
    const e = new Error('latitude và longitude bắt buộc'); e.status = 400; throw e;
  }
  const lat = Number(latitude), lon = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) { const e = new Error('latitude không hợp lệ'); e.status = 400; throw e; }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) { const e = new Error('longitude không hợp lệ'); e.status = 400; throw e; }
  if (id !== undefined && (typeof id !== 'string' || id.trim().length < 2 || id.trim().length > 50)) {
    const e = new Error('id (nếu có) phải là chuỗi 2–50 ký tự'); e.status = 400; throw e;
  }
  if (address !== undefined && typeof address !== 'string') {
    const e = new Error('address phải là chuỗi'); e.status = 400; throw e;
  }
}


// Update cảng
export function assertUpdatePort(body) {
  if (!body || typeof body !== 'object') { const e = new Error('Body không hợp lệ'); e.status = 400; throw e; }
  const allowed = ['name','code','city','address','latitude','longitude'];
  const keys = Object.keys(body);
  if (keys.length === 0) { const e = new Error('Không có trường nào để cập nhật'); e.status = 400; throw e; }
  for (const k of keys) if (!allowed.includes(k)) { const e = new Error(`Trường không được phép: ${k}`); e.status = 400; throw e; }

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 2)) {
    const e = new Error('name không hợp lệ'); e.status = 400; throw e;
  }
  if (body.code !== undefined && (typeof body.code !== 'string' || body.code.trim().length < 2 || body.code.trim().length > 10)) {
    const e = new Error('code không hợp lệ'); e.status = 400; throw e;
  }
  if (body.city !== undefined && (typeof body.city !== 'string' || body.city.trim().length < 2)) {
    const e = new Error('city không hợp lệ'); e.status = 400; throw e;
  }
  if (body.address !== undefined && typeof body.address !== 'string') {
    const e = new Error('address phải là chuỗi'); e.status = 400; throw e;
  }
  if (body.latitude !== undefined) {
    const v = Number(body.latitude);
    if (!Number.isFinite(v) || v < -90 || v > 90) { const e = new Error('latitude không hợp lệ'); e.status = 400; throw e; }
  }
  if (body.longitude !== undefined) {
    const v = Number(body.longitude);
    if (!Number.isFinite(v) || v < -180 || v > 180) { const e = new Error('longitude không hợp lệ'); e.status = 400; throw e; }
  }
}


export function assertCreateRoute(body) {
  const { from_port_id, to_port_id, distance_km, estimated_duration_minutes } = body || {};
  if (!from_port_id || !to_port_id) { const e = new Error('from_port_id và to_port_id bắt buộc'); e.status = 400; throw e; }
  if (from_port_id === to_port_id) { const e = new Error('from_port_id và to_port_id không được trùng'); e.status = 400; throw e; }

  if (distance_km !== undefined && distance_km !== null) {
    const v = Number(distance_km); if (!Number.isFinite(v) || v < 0) { const e = new Error('distance_km phải ≥ 0'); e.status = 400; throw e; }
  }
  if (estimated_duration_minutes !== undefined && estimated_duration_minutes !== null) {
    const v = Number(estimated_duration_minutes);
    if (!Number.isInteger(v) || v < 0) { const e = new Error('estimated_duration_minutes phải là số nguyên ≥ 0'); e.status = 400; throw e; }
  }
}

export function assertUpdateRoute(body) {
  if (!body || typeof body !== 'object') { const e = new Error('Body không hợp lệ'); e.status = 400; throw e; }
  const allowed = ['from_port_id','to_port_id','distance_km','estimated_duration_minutes'];
  const keys = Object.keys(body);
  if (keys.length === 0) { const e = new Error('Không có trường nào để cập nhật'); e.status = 400; throw e; }
  for (const k of keys) if (!allowed.includes(k)) { const e = new Error(`Trường không được phép: ${k}`); e.status = 400; throw e; }

  if (body.distance_km !== undefined && body.distance_km !== null) {
    const v = Number(body.distance_km); if (!Number.isFinite(v) || v < 0) { const e = new Error('distance_km phải ≥ 0'); e.status = 400; throw e; }
  }
  if (body.estimated_duration_minutes !== undefined && body.estimated_duration_minutes !== null) {
    const v = Number(body.estimated_duration_minutes);
    if (!Number.isInteger(v) || v < 0) { const e = new Error('estimated_duration_minutes phải là số nguyên ≥ 0'); e.status = 400; throw e; }
  }
}

