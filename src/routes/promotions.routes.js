import { Router } from 'express';
import {
  handleCreatePromotion,
  handleDeletePromotion,
  handleListPromotions,
  handleUpdatePromotion,
} from '../controllers/promotions.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', handleListPromotions);
router.post('/', requireAuth, handleCreatePromotion);
router.patch('/:id', requireAuth, handleUpdatePromotion);
router.delete('/:id', requireAuth, handleDeletePromotion);

export default router;
