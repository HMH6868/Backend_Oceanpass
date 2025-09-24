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