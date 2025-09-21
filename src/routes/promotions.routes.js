import { Router } from 'express';
import { handleListPromotions } from '../controllers/promotions.controller.js';

const router = Router();

// Public read-only
router.get('/', handleListPromotions);

export default router;
