import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { handleUpdateMe } from '../controllers/user.controller.js';
import { assertUpdateProfile } from '../utils/validator.js';

const router = Router();

// Cập nhật hồ sơ bản thân (chỉ name, phone)
router.patch('/me', requireAuth, (req, res, next) => {
  try { assertUpdateProfile(req.body); } catch (e) { return next(e); }
  return handleUpdateMe(req, res, next);
});

export default router;
