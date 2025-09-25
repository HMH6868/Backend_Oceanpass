import { Router } from 'express';
import {
  handleChangePassword,
  handleUpdateAvatar,
  handleUpdateMe,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { assertUpdateProfile } from '../utils/validator.js';

const router = Router();

// Cập nhật hồ sơ bản thân (chỉ name, phone)
router.patch('/me', requireAuth, (req, res, next) => {
  try {
    assertUpdateProfile(req.body);
  } catch (e) {
    return next(e);
  }
  return handleUpdateMe(req, res, next);
});

// Cập nhật chỉ avatar
router.patch('/me/avatar', requireAuth, handleUpdateAvatar);

// Đổi mật khẩu
router.patch('/me/password', requireAuth, handleChangePassword);

export default router;
