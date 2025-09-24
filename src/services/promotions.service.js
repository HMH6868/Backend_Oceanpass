import { pool } from '../db.js';

export const getPromotions = async () => {
  const { rows } = await pool.query('SELECT * FROM promotions');
  return rows;
};

export const createPromotion = async (promotion) => {
  const {
    code,
    name, // Đã thêm lại trường name
    description,
    type,
    value,
    min_amount,
    max_discount,
    valid_from,
    valid_to,
    is_active,
  } = promotion;

  const { rows } = await pool.query(
    'INSERT INTO promotions (id, code, name, description, type, value, min_amount, max_discount, valid_from, valid_to, is_active) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    [
      code,
      name, // Thêm lại name vào đây
      description,
      type,
      value,
      min_amount,
      max_discount,
      valid_from,
      valid_to,
      is_active,
    ]
  );
  return rows[0];
};

export const updatePromotion = async (id, dataToUpdate) => {
  const currentPromotionResult = await pool.query('SELECT * FROM promotions WHERE id = $1', [id]);
  if (currentPromotionResult.rows.length === 0) {
    const err = new Error('Promotion not found');
    err.status = 404;
    throw err;
  }
  const currentPromotion = currentPromotionResult.rows[0];

  const updatedData = {
    code: dataToUpdate.code || currentPromotion.code,
    name: dataToUpdate.name || currentPromotion.name, // Thêm name
    description: dataToUpdate.description || currentPromotion.description,
    type: dataToUpdate.type || currentPromotion.type,
    value: dataToUpdate.value || currentPromotion.value,
    min_amount: dataToUpdate.min_amount || currentPromotion.min_amount,
    max_discount: dataToUpdate.max_discount || currentPromotion.max_discount,
    valid_from: dataToUpdate.valid_from || currentPromotion.valid_from,
    valid_to: dataToUpdate.valid_to || currentPromotion.valid_to,
    is_active: dataToUpdate.is_active !== undefined ? dataToUpdate.is_active : currentPromotion.is_active,
  };

  const { rows } = await pool.query(
    'UPDATE promotions SET code = $1, name = $2, description = $3, type = $4, value = $5, min_amount = $6, max_discount = $7, valid_from = $8, valid_to = $9, is_active = $10 WHERE id = $11 RETURNING *',
    [
      updatedData.code,
      updatedData.name, // Thêm name
      updatedData.description,
      updatedData.type,
      updatedData.value,
      updatedData.min_amount,
      updatedData.max_discount,
      updatedData.valid_from,
      updatedData.valid_to,
      updatedData.is_active,
      id,
    ]
  );
  return rows[0];
};

export const deletePromotion = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM promotions WHERE id = $1', [id]);
  if (rowCount === 0) {
    const err = new Error('Promotion not found');
    err.status = 404;
    throw err;
  }
};