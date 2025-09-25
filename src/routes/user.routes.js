import { Router } from 'express';
import { requireAuth, checkAdminRole } from '../middlewares/auth.middleware.js';
import { handleUpdateMe, handleUpdateUserRole, handleGetEmployees, testDatabase } from '../controllers/user.controller.js';
import { assertUpdateProfile } from '../utils/validator.js';

const router = Router();

// Test database connection (no auth required for debugging)
router.get('/test-db', testDatabase);

// Test employees endpoint without auth (for debugging)
router.get('/test-employees', handleGetEmployees);

// Lấy danh sách nhân viên (role admin, manager, staff) - temporarily without auth for testing
router.get('/', handleGetEmployees);

// Admin cập nhật role cho user bất kỳ - temporarily without auth for testing
router.patch('/:id/role', handleUpdateUserRole);

// Cập nhật hồ sơ bản thân (chỉ name, phone)
router.patch('/me', requireAuth, (req, res, next) => {
  try { 
    assertUpdateProfile(req.body); 
  } catch (e) { 
    return next(e); 
  }
  return handleUpdateMe(req, res, next);
});

export default router;