import * as promotionsService from '../services/promotions.service.js';

export const getPromotions = async (req, res, next) => {
  try {
    const promotions = await promotionsService.getPromotions();
    res.status(200).json({ ok: true, data: promotions });
  } catch (e) {
    next(e);
  }
};

export const createPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionsService.createPromotion(req.body);
    res.status(201).json({ ok: true, data: promotion });
  } catch (e) {
    next(e);
  }
};

export const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promotion = await promotionsService.updatePromotion(id, req.body);
    res.status(200).json({ ok: true, data: promotion });
  } catch (e) {
    next(e);
  }
};

export const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await promotionsService.deletePromotion(id);
    res.status(200).json({ ok: true, data: { message: 'Promotion deleted successfully' } });
  } catch (e) {
    next(e);
  }
};

// === HÀM MỚI ĐỂ XỬ LÝ REQUEST KIỂM TRA MÃ ===
export const checkPromotion = async (req, res, next) => {
  try {
    const { code, total_amount } = req.body;
    if (!code || total_amount === undefined) {
      const err = new Error('Vui lòng cung cấp "code" và "total_amount"');
      err.status = 400;
      throw err;
    }

    const result = await promotionsService.checkPromotion({ code, total_amount });
    res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
};