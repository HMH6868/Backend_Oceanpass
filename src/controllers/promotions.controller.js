import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from '../services/promotions.service.js';
import { assertCreatePromotion, assertUpdatePromotion } from '../utils/validator.js';

export async function handleListPromotions(req, res, next) {
  try {
    const { page, pageSize, q, activeOnly, nowOnly } = req.query;
    const toBool = (v) => v === 'true' || v === true;

    const result = await listPromotions({
      page,
      pageSize,
      q,
      activeOnly: toBool(activeOnly),
      nowOnly: toBool(nowOnly),
    });

    res.json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function handleCreatePromotion(req, res, next) {
  try {
    // requireAuth đã gắn req.user
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) {
      const err = new Error('bạn không không có quyền thêm mã khuyến mãi');
      err.status = 403;
      throw err;
    }

    // validate body
    assertCreatePromotion(req.body);

    const created = await createPromotion(req.body);
    res.status(201).json({ ok: true, data: created });
  } catch (e) {
    // Bonus xử lý duplicate từ DB (nếu có unique index)
    if (e?.code === '23505') {
      e.status = 409;
      e.message = e.message?.includes('promotions_code')
        ? 'Mã khuyến mãi (code) đã tồn tại'
        : 'Dữ liệu trùng lặp';
    }
    next(e);
  }
}

// Cập nhật mã khuyến mãi

export async function handleUpdatePromotion(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) {
      const err = new Error('bạn không không có quyền thêm mã khuyến mãi');
      err.status = 403;
      throw err;
    }

    assertUpdatePromotion(req.body);

    const updated = await updatePromotion(req.params.id, req.body);
    res.json({ ok: true, data: updated });
  } catch (e) {
    if (e?.code === '23505') {
      // phòng khi có unique index ở DB
      e.status = 409;
      e.message = 'Mã khuyến mãi (code) đã tồn tại';
    }
    next(e);
  }
}

export async function handleDeletePromotion(req, res, next) {
  try {
    const roleId = req.user?.role_id;
    if (roleId !== 1 && roleId !== 2) {
      const err = new Error('bạn không không có quyền thêm mã khuyến mãi');
      err.status = 403;
      throw err;
    }

    const deleted = await deletePromotion(req.params.id);
    res.json({ ok: true, data: deleted });
  } catch (e) {
    // FK constraint -> đang được tham chiếu nơi khác
    if (e?.code === '23503') {
      e.status = 409;
      e.message = 'Không thể xoá vì đang được sử dụng';
    }
    next(e);
  }
}
