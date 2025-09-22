import { query } from '../db.js';

/** Danh sách + lọc + phân trang */
export async function listPorts({ page = 1, pageSize = 10, q }) {
  const where = [];
  const params = [];
  let i = 1;

  if (q && q.trim()) {
    where.push(`(name ILIKE $${i} OR code ILIKE $${i} OR city ILIKE $${i})`);
    params.push(`%${q.trim()}%`);
    i++;
  }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const offset = Math.max(0, (Number(page) - 1) * limit);

  const countRes = await query(`SELECT COUNT(*)::int AS total FROM ports ${whereSQL}`, params);
  const dataRes = await query(
    `SELECT id, name, code, city, address, latitude, longitude
       FROM ports
       ${whereSQL}
       ORDER BY name ASC
       LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );

  return { page: Number(page), pageSize: limit, total: countRes.rows[0]?.total ?? 0, items: dataRes.rows };
}

/** Xem chi tiết */
export async function getPort(id) {
  const rs = await query(
    `SELECT id, name, code, city, address, latitude, longitude FROM ports WHERE id = $1`,
    [id]
  );
  if (rs.rowCount === 0) {
    const err = new Error('Port không tồn tại'); err.status = 404; throw err;
  }
  return rs.rows[0];
}

/** Tạo (id optional; nếu không gửi sẽ tự tạo uuid text) */
export async function createPort(data) {
  // chặn code trùng
  const dup = await query(`SELECT 1 FROM ports WHERE code = $1 LIMIT 1`, [data.code.trim()]);
  if (dup.rowCount > 0) { const e = new Error('Mã cảng (code) đã tồn tại'); e.status = 409; throw e; }

  const rs = await query(
    `
    INSERT INTO ports (id, name, code, city, address, latitude, longitude)
    VALUES (
      COALESCE($1::text, gen_random_uuid()::text),
      $2, $3, $4, $5, $6, $7
    )
    RETURNING id, name, code, city, address, latitude, longitude
    `,
    [
      data.id ?? null,
      data.name.trim(),
      data.code.trim(),
      data.city.trim(),
      data.address ?? null,
      Number(data.latitude),
      Number(data.longitude),
    ]
  );
  return rs.rows[0];
}

/** Sửa (cập nhật động + chống trùng code) */
export async function updatePort(id, body) {
  if (body.code !== undefined && String(body.code).trim() !== '') {
    const dup = await query(`SELECT 1 FROM ports WHERE code = $1 AND id <> $2 LIMIT 1`, [String(body.code).trim(), id]);
    if (dup.rowCount > 0) { const e = new Error('Mã cảng (code) đã tồn tại'); e.status = 409; throw e; }
  }

  const sets = []; const vals = []; let i = 1;
  const set = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (body.name !== undefined)      set('name',      body.name === '' ? null : String(body.name).trim());
  if (body.code !== undefined)      set('code',      body.code === '' ? null : String(body.code).trim());
  if (body.city !== undefined)      set('city',      body.city === '' ? null : String(body.city).trim());
  if (body.address !== undefined)   set('address',   body.address === '' ? null : String(body.address));
  if (body.latitude !== undefined)  set('latitude',  body.latitude === '' ? null : Number(body.latitude));
  if (body.longitude !== undefined) set('longitude', body.longitude === '' ? null : Number(body.longitude));

  if (sets.length === 0) { const e = new Error('Không có trường nào để cập nhật'); e.status = 400; throw e; }

  const rs = await query(
    `
    UPDATE ports
       SET ${sets.join(', ')}
     WHERE id = $${i}
     RETURNING id, name, code, city, address, latitude, longitude
    `,
    [...vals, id]
  );
  if (rs.rowCount === 0) { const e = new Error('Port không tồn tại'); e.status = 404; throw e; }
  return rs.rows[0];
}

/** Xoá (sẽ lỗi 23503 nếu đang được routes tham chiếu) */
export async function deletePort(id) {
  const rs = await query(
    `DELETE FROM ports WHERE id = $1
     RETURNING id, name, code, city, address, latitude, longitude`,
    [id]
  );
  if (rs.rowCount === 0) { const e = new Error('Port không tồn tại'); e.status = 404; throw e; }
  return rs.rows[0];
}
