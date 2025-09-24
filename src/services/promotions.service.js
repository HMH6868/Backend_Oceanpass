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



export const checkPromotion = async ({ code, total_amount }) => {
  // 1. Tìm mã khuyến mãi
  const { rows } = await pool.query('SELECT * FROM promotions WHERE code = $1', [code]);
  if (rows.length === 0) {
    const err = new Error('Mã khuyến mãi không hợp lệ');
    err.status = 404; // Not Found
    throw err;
  }
  const promotion = rows[0];

  // 2. Kiểm tra mã có được kích hoạt không
  if (!promotion.is_active) {
    const err = new Error('Mã khuyến mãi này đã bị vô hiệu hóa');
    err.status = 400; // Bad Request
    throw err;
  }

  // 3. Kiểm tra ngày hiệu lực
  const now = new Date();
  const valid_from = new Date(promotion.valid_from);
  const valid_to = new Date(promotion.valid_to);
  if (now < valid_from || now > valid_to) {
    const err = new Error('Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực');
    err.status = 400; // Bad Request
    throw err;
  }

  // 4. Kiểm tra số tiền tối thiểu
  if (total_amount < promotion.min_amount) {
    const err = new Error(
      `Đơn hàng của bạn phải có giá trị tối thiểu ${promotion.min_amount.toLocaleString(
        'vi-VN'
      )} ₫ để áp dụng mã này`
    );
    err.status = 400; // Bad Request
    throw err;
  }

  // 5. Tính toán số tiền được giảm
  let discount_amount = 0;
  if (promotion.type === 'percentage') {
    discount_amount = total_amount * (promotion.value / 100);
    // Áp dụng mức giảm giá tối đa
    if (discount_amount > promotion.max_discount) {
      discount_amount = promotion.max_discount;
    }
  } else {
    // 'fixed_amount'
    discount_amount = promotion.value;
  }

  const final_amount = total_amount - discount_amount;

  // 6. Trả về kết quả thành công
  return {
    valid: true,
    discount_amount: Math.round(discount_amount),
    final_amount: Math.round(final_amount),
    message: 'Áp dụng mã khuyến mãi thành công!',
  };
};