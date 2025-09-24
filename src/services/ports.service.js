import { pool } from '../db.js';

export const getPorts = async () => {
  const { rows } = await pool.query('SELECT * FROM ports');
  return rows;
};

export const createPort = async (port) => {
  const { name, code, city, address, latitude, longitude } = port;
  const { rows } = await pool.query(
    'INSERT INTO ports (id, name, code, city, address, latitude, longitude) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING *',
    [name, code, city, address, latitude, longitude]
  );
  return rows[0];
};

export const updatePort = async (id, dataToUpdate) => {
  const currentPortResult = await pool.query('SELECT * FROM ports WHERE id = $1', [id]);
  if (currentPortResult.rows.length === 0) {
    const err = new Error('Port not found');
    err.status = 404;
    throw err;
  }
  const currentPort = currentPortResult.rows[0];

  const updatedData = {
    name: dataToUpdate.name || currentPort.name,
    code: dataToUpdate.code || currentPort.code,
    city: dataToUpdate.city || currentPort.city,
    address: dataToUpdate.address || currentPort.address,
    latitude: dataToUpdate.latitude || currentPort.latitude,
    longitude: dataToUpdate.longitude || currentPort.longitude,
  };

  const { rows } = await pool.query(
    'UPDATE ports SET name = $1, code = $2, city = $3, address = $4, latitude = $5, longitude = $6 WHERE id = $7 RETURNING *',
    [
      updatedData.name,
      updatedData.code,
      updatedData.city,
      updatedData.address,
      updatedData.latitude,
      updatedData.longitude,
      id,
    ]
  );
  return rows[0];
};

export const deletePort = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM ports WHERE id = $1', [id]);
  if (rowCount === 0) {
    const err = new Error('Port not found');
    err.status = 404;
    throw err;
  }
};