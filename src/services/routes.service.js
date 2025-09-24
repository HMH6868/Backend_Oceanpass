import { pool } from '../db.js';

export const getRoutes = async () => {
  // SỬA LẠI TÊN CỘT Ở ĐÂY
  const { rows } = await pool.query(`
    SELECT 
      r.id, 
      r.distance_km, 
      r.estimated_duration_minutes,
      p_origin.name as origin_port_name,
      p_destination.name as destination_port_name,
      r.from_port_id,
      r.to_port_id
    FROM routes r
    JOIN ports p_origin ON r.from_port_id = p_origin.id
    JOIN ports p_destination ON r.to_port_id = p_destination.id
  `);
  return rows;
};

export const createRoute = async (route) => {
  const {
    from_port_id,
    to_port_id,
    distance_km,
    estimated_duration_minutes,
  } = route;

  if (from_port_id === to_port_id) {
    const err = new Error('Cảng đi và cảng đến không được trùng nhau');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    'INSERT INTO routes (id, from_port_id, to_port_id, distance_km, estimated_duration_minutes) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
    [
      from_port_id,
      to_port_id,
      distance_km,
      estimated_duration_minutes,
    ]
  );
  return rows[0];
};

export const updateRoute = async (id, dataToUpdate) => {
    const currentRouteResult = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
    if (currentRouteResult.rows.length === 0) {
        const err = new Error('Route not found');
        err.status = 404;
        throw err;
    }
    const currentRoute = currentRouteResult.rows[0];

    const updatedData = {
      from_port_id: dataToUpdate.from_port_id || currentRoute.from_port_id,
      to_port_id: dataToUpdate.to_port_id || currentRoute.to_port_id,
      distance_km: dataToUpdate.distance_km || currentRoute.distance_km,
      estimated_duration_minutes: dataToUpdate.estimated_duration_minutes || currentRoute.estimated_duration_minutes,
    };

    if (updatedData.from_port_id === updatedData.to_port_id) {
        const err = new Error('Cảng đi và cảng đến không được trùng nhau');
        err.status = 400;
        throw err;
    }

    const { rows } = await pool.query(
        'UPDATE routes SET from_port_id = $1, to_port_id = $2, distance_km = $3, estimated_duration_minutes = $4 WHERE id = $5 RETURNING *',
        [
            updatedData.from_port_id,
            updatedData.to_port_id,
            updatedData.distance_km,
            updatedData.estimated_duration_minutes,
            id,
        ]
    );
    return rows[0];
};

export const deleteRoute = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM routes WHERE id = $1', [id]);
  if (rowCount === 0) {
    const err = new Error('Route not found');
    err.status = 404;
    throw err;
  }
};