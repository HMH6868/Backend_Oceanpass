import { listPromotions } from '../services/promotions.service.js';

export async function handleListPromotions(req, res, next) {
  try {
    const { page, pageSize, q, activeOnly, nowOnly } = req.query;

    // Chuyển bool từ query string
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
