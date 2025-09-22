import { query } from '../db.js';

// Get mã khuyến mãi
export async function listPromotions({ page = 1, pageSize = 10, q, activeOnly, nowOnly }) {
  const where = [];
  const params = [];
  let i = 1;

  // Tìm theo code/name
  if (q && q.trim() !== '') {
    where.push(`(code ILIKE $${i} OR name ILIKE $${i})`);
    params.push(`%${q.trim()}%`);
    i++;
  }

  if (activeOnly === true) {
    where.push(`is_active = true`);
  }

  if (nowOnly === true) {
    where.push(`(valid_from <= NOW() AND valid_to >= NOW())`);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Đếm tổng
  const countSQL = `SELECT COUNT(*)::int AS total FROM promotions ${whereSQL}`;
  const countRes = await query(countSQL, params);
  const total = countRes.rows[0]?.total ?? 0;

  // Phân trang
  const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const offset = Math.max(0, (Number(page) - 1) * limit);

  // Lấy dữ liệu (CHỈ chọn các cột có thật)
  const dataSQL = `
    SELECT
      id, code, name, description,
      type, value, min_amount, max_discount,
      valid_from, valid_to, is_active
    FROM promotions
    ${whereSQL}
    ORDER BY valid_from DESC NULLS LAST
    LIMIT $${i} OFFSET $${i + 1}
  `;
  const dataRes = await query(dataSQL, [...params, limit, offset]);

  return {
    page: Number(page),
    pageSize: limit,
    total,
    items: dataRes.rows,
  };
}

// Tạo mã khuyến mãi 
const checkCodeSQL = `SELECT 1 FROM promotions WHERE code = $1 LIMIT 1`;
const insertPromotionSQL = `
  INSERT INTO promotions
  (id, code, name, description, type, value, min_amount, max_discount, valid_from, valid_to, is_active)
  VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, true))
  RETURNING id, code, name, description, type, value, min_amount, max_discount, valid_from, valid_to, is_active
`;

export async function createPromotion(data) {
  // code trùng?
  const dup = await query(checkCodeSQL, [data.code.trim()]);
  if (dup.rowCount > 0) {
    const err = new Error('Mã khuyến mãi (code) đã tồn tại');
    err.status = 409; throw err;
  }

  const params = [
    data.code.trim(),
    data.name.trim(),
    data.description ?? null,
    data.type,
    Number(data.value),
    data.min_amount === undefined || data.min_amount === '' ? null : Number(data.min_amount),
    data.max_discount === undefined || data.max_discount === '' ? null : Number(data.max_discount),
    data.valid_from ? new Date(data.valid_from) : null,
    data.valid_to   ? new Date(data.valid_to)   : null,
    data.is_active === undefined ? true : !!data.is_active,
  ];

  const rs = await query(insertPromotionSQL, params);
  return rs.rows[0];
}


// Cập nhật mã khuyến mãi

const codeExistsOtherSQL = `SELECT 1 FROM promotions WHERE code = $1 AND id <> $2 LIMIT 1`;

export async function updatePromotion(id, body) {
  // nếu cập nhật code, kiểm tra trùng (loại trừ chính mã đang sửa)
  if (body.code !== undefined && body.code !== null && String(body.code).trim() !== '') {
    const dup = await query(codeExistsOtherSQL, [String(body.code).trim(), id]);
    if (dup.rowCount > 0) {
      const err = new Error('Mã khuyến mãi (code) đã tồn tại'); err.status = 409; throw err;
    }
  }

  const sets = [];
  const vals = [];
  let i = 1;

  const pushSet = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (body.code !== undefined)        pushSet('code',        body.code === '' ? null : String(body.code).trim());
  if (body.name !== undefined)        pushSet('name',        body.name === '' ? null : String(body.name).trim());
  if (body.description !== undefined) pushSet('description', body.description === '' ? null : String(body.description));
  if (body.type !== undefined)        pushSet('type',        body.type);
  if (body.value !== undefined)       pushSet('value',       Number(body.value));
  if (body.min_amount !== undefined)  pushSet('min_amount',  body.min_amount === '' ? null : Number(body.min_amount));
  if (body.max_discount !== undefined)pushSet('max_discount',body.max_discount === '' ? null : Number(body.max_discount));
  if (body.valid_from !== undefined)  pushSet('valid_from',  body.valid_from ? new Date(body.valid_from) : null);
  if (body.valid_to !== undefined)    pushSet('valid_to',    body.valid_to ? new Date(body.valid_to) : null);
  if (body.is_active !== undefined)   pushSet('is_active',   !!body.is_active);

  if (sets.length === 0) {
    const err = new Error('Không có trường nào để cập nhật'); err.status = 400; throw err;
  }

  const sql = `
    UPDATE promotions
       SET ${sets.join(', ')}
     WHERE id = $${i}
     RETURNING id, code, name, description, type, value, min_amount, max_discount, valid_from, valid_to, is_active
  `;
  vals.push(id);

  const rs = await query(sql, vals);
  if (rs.rowCount === 0) {
    const err = new Error('Promotion không tồn tại'); err.status = 404; throw err;
  }
  return rs.rows[0];
}




// Xoá 1 promotion theo id
export async function deletePromotion(id) {
  const sql = `
    DELETE FROM promotions
     WHERE id = $1
     RETURNING id, code, name, description, type, value, min_amount, max_discount, valid_from, valid_to, is_active
  `;
  const rs = await query(sql, [id]);
  if (rs.rowCount === 0) {
    const err = new Error('Promotion không tồn tại');
    err.status = 404; throw err;
  }
  return rs.rows[0];
}
