import express from 'express';
import { handleGetEmployees, handleGetCustomers, handleUpdateEmployeeRole, testDatabase } from '../controllers/employee.controller.js';
import { requireAuth, checkAdminRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/employees - Lấy danh sách employees (admin, manager, staff)
router.get('/', handleGetEmployees);

// GET /api/employees/customers - Lấy danh sách customers
router.get('/customers', handleGetCustomers);

// PATCH /api/employees/:id/role - Cập nhật role của employee
router.patch('/:id/role', requireAuth, checkAdminRole, handleUpdateEmployeeRole);

// GET /api/employees/test-db - Test database connection
router.get('/test-db', testDatabase);

export default router;
