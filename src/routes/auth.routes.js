import { Router } from 'express';
import {
  handleLogin,
  handleLogout,
  handleMe,
  handleRegister,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { assertLogin, assertRegister } from '../utils/validator.js';

const router = Router();

router.post('/register', (req, res, next) => {
  try {
    assertRegister(req.body);
  } catch (e) {
    return next(e);
  }
  return handleRegister(req, res, next);
});

router.post('/login', (req, res, next) => {
  try {
    assertLogin(req.body);
  } catch (e) {
    return next(e);
  }
  return handleLogin(req, res, next);
});

router.post('/logout', requireAuth, handleLogout);

router.get('/me', requireAuth, handleMe);

export default router;
