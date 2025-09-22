import { query } from '../db.js';

/** Danh sách + lọc + phân trang (join tên cảng) */
export async function listRoutes({ page = 1, pageSize = 10, q }) {
  const where = [];
  const params = [];
  let i = 1;

  if (q && q.trim()) {
    where.push(`(
      fp.name ILIKE $${i} OR fp.code ILIKE $${i} OR fp.city ILIKE $${i} OR
      tp.name ILIKE $${i} OR tp.code ILIKE $${i} OR tp.city ILIKE $${i}
    )`);
    params.push(`%${q.trim()}%`);
    i++;
  }
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const limit = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const offset = Math.max(0, (Number(page) - 1) * limit);

  const countRes = await query(
    `SELECT COUNT(*)::int AS total
       FROM routes r
       JOIN ports fp ON fp.id = r.from_port_id
       JOIN ports tp ON tp.id = r.to_port_id
     ${whereSQL}`, params
  );

  const dataRes = await query(
    `SELECT
       r.id, r.from_port_id, r.to_port_id,
       r.distance_km, r.estimated_duration_minutes,
       fp.name AS from_port_name, tp.name AS to_port_name
     FROM routes r
     JOIN ports fp ON fp.id = r.from_port_id
     JOIN ports tp ON tp.id = r.to_port_id
     ${whereSQL}
     ORDER BY fp.name ASC, tp.name ASC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );

  return { page: Number(page), pageSize: limit, total: countRes.rows[0]?.total ?? 0, items: dataRes.rows };
}

/** Xem chi tiết */
export async function getRoute(id) {
  const rs = await query(
    `SELECT
       r.id, r.from_port_id, r.to_port_id,
       r.distance_km, r.estimated_duration_minutes,
       fp.name AS from_port_name, tp.name AS to_port_name
     FROM routes r
     JOIN ports fp ON fp.id = r.from_port_id
     JOIN ports tp ON tp.id = r.to_port_id
     WHERE r.id = $1`,
    [id]
  );
  if (rs.rowCount === 0) { const e = new Error('Route không tồn tại'); e.status = 404; throw e; }
  return rs.rows[0];
}

/** Tạo mới (id tuỳ chọn, nếu không gửi sẽ tự tạo uuid text) */
export async function createRoute(data) {
  const { from_port_id, to_port_id } = data;

  if (!from_port_id || !to_port_id) {
    const e = new Error('from_port_id và to_port_id bắt buộc'); e.status = 400; throw e;
  }
  if (from_port_id === to_port_id) {
    const e = new Error('from_port_id và to_port_id không được trùng'); e.status = 400; throw e;
  }

  // kiểm tra cảng tồn tại
  const portsRes = await query(`SELECT id FROM ports WHERE id = ANY($1)`, [[from_port_id, to_port_id]]);
  if (portsRes.rowCount !== 2) { const e = new Error('Cảng đi/đến không hợp lệ'); e.status = 400; throw e; }

  // chặn trùng tuyến cùng chiều
  const dup = await query(
    `SELECT 1 FROM routes WHERE from_port_id=$1 AND to_port_id=$2 LIMIT 1`,
    [from_port_id, to_port_id]
  );
  if (dup.rowCount > 0) { const e = new Error('Tuyến đã tồn tại'); e.status = 409; throw e; }

  const rs = await query(
    `INSERT INTO routes
       (id, from_port_id, to_port_id, distance_km, estimated_duration_minutes)
     VALUES (COALESCE($1::text, gen_random_uuid()::text), $2, $3, $4, $5)
     RETURNING id, from_port_id, to_port_id, distance_km, estimated_duration_minutes`,
    [
      data.id ?? null,
      from_port_id,
      to_port_id,
      data.distance_km == null ? null : Number(data.distance_km),
      data.estimated_duration_minutes == null ? null : Number(data.estimated_duration_minutes)
    ]
  );
  return rs.rows[0];
}

/** Cập nhật động (kiểm tra hợp lệ & trùng when đổi from/to) */
export async function updateRoute(id, body) {
  // nếu đổi from/to, kiểm tra hợp lệ & trùng
  if (body.from_port_id !== undefined || body.to_port_id !== undefined) {
    const cur = await query(`SELECT from_port_id, to_port_id FROM routes WHERE id=$1`, [id]);
    if (cur.rowCount === 0) { const e = new Error('Route không tồn tại'); e.status = 404; throw e; }
    const newFrom = body.from_port_id ?? cur.rows[0].from_port_id;
    const newTo   = body.to_port_id   ?? cur.rows[0].to_port_id;

    if (newFrom === newTo) { const e = new Error('from_port_id và to_port_id không được trùng'); e.status = 400; throw e; }

    const portsRes = await query(`SELECT id FROM ports WHERE id = ANY($1)`, [[newFrom, newTo]]);
    if (portsRes.rowCount !== 2) { const e = new Error('Cảng đi/đến không hợp lệ'); e.status = 400; throw e; }

    const dup = await query(
      `SELECT 1 FROM routes WHERE from_port_id=$1 AND to_port_id=$2 AND id <> $3 LIMIT 1`,
      [newFrom, newTo, id]
    );
    if (dup.rowCount > 0) { const e = new Error('Tuyến đã tồn tại'); e.status = 409; throw e; }
  }

  const sets = []; const vals = []; let i = 1;
  const set = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (body.from_port_id !== undefined) set('from_port_id', body.from_port_id);
  if (body.to_port_id   !== undefined) set('to_port_id',   body.to_port_id);
  if (body.distance_km !== undefined)  set('distance_km',  body.distance_km == null ? null : Number(body.distance_km));
  if (body.estimated_duration_minutes !== undefined)
    set('estimated_duration_minutes', body.estimated_duration_minutes == null ? null : Number(body.estimated_duration_minutes));

  if (sets.length === 0) { const e = new Error('Không có trường nào để cập nhật'); e.status = 400; throw e; }

  const rs = await query(
    `UPDATE routes
        SET ${sets.join(', ')}
      WHERE id = $${i}
      RETURNING id, from_port_id, to_port_id, distance_km, estimated_duration_minutes`,
    [...vals, id]
  );
  if (rs.rowCount === 0) { const e = new Error('Route không tồn tại'); e.status = 404; throw e; }
  return rs.rows[0];
}

/** Xoá */
export async function deleteRoute(id) {
  const rs = await query(
    `DELETE FROM routes
      WHERE id = $1
      RETURNING id, from_port_id, to_port_id, distance_km, estimated_duration_minutes`,
    [id]
  );
  if (rs.rowCount === 0) { const e = new Error('Route không tồn tại'); e.status = 404; throw e; }
  return rs.rows[0];
}
