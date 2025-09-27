import { getEmployees, getCustomers, updateEmployeeRole } from '../services/employee.service.js';
import { query } from '../db.js';

export async function handleGetEmployees(req, res, next) {
  try {
    const employees = await getEmployees();
    res.json({ ok: true, data: employees });
  } catch (e) {
    next(e);
  }
}

export async function handleUpdateEmployeeRole(req, res, next) {
  try {
    const { roleId } = req.body;
    const employee = await updateEmployeeRole(req.params.id, roleId);
    res.json({ ok: true, data: employee });
  } catch (e) {
    next(e);
  }
}

export async function handleGetCustomers(req, res, next) {
  try {
    const customers = await getCustomers();
    res.json({ ok: true, data: customers });
  } catch (e) {
    next(e);
  }
}

export async function testDatabase(req, res, next) {
  try {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE role_id IN (1, 2, 3)';
    const result = await query(sql);
    res.json({ 
      ok: true, 
      message: 'Database connection successful',
      employeeCount: result.rows[0].count 
    });
  } catch (e) {
    next(e);
  }
}
