import { Router } from 'express';
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
} from '../controllers/promotions.controller.js';
import { requireAuth, checkAdminRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getPromotions);
router.post('/', requireAuth, checkAdminRole, createPromotion);
router.patch('/:id', requireAuth, checkAdminRole, updatePromotion);
router.delete('/:id', requireAuth, checkAdminRole, deletePromotion);

export default router;