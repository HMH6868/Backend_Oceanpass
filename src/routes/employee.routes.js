import { Router } from 'express';
import { requireAuth, checkAdminRole } from '../middlewares/auth.middleware.js';
import { handleGetEmployees, handleUpdateEmployeeRole, testDatabase } from '../controllers/employee.controller.js';
import { assertUpdateProfile } from '../utils/validator.js';

const router = Router();

// Test database connection (no auth required for debugging)
router.get('/test-db', testDatabase);

// Lấy danh sách nhân viên từ employees table
router.get('/', handleGetEmployees);

// Admin cập nhật role cho employee
router.patch('/:id/role', handleUpdateEmployeeRole);

export default router;
