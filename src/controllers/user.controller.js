import { query } from '../db.js';

// Test endpoint để kiểm tra database connection
export async function testDatabase(req, res, next) {
  try {
    const sql = `SELECT COUNT(*) as count FROM users WHERE role_id IN (1,2,3)`;
    const rs = await query(sql);
    res.json({ 
      ok: true, 
      message: 'Database connection OK',
      employeeCount: rs.rows[0].count 
    });
  } catch (e) {
    console.error('Database test error:', e);
    res.status(500).json({ 
      ok: false, 
      message: 'Database connection failed',
      error: e.message 
    });
  }
}

// Lấy danh sách nhân viên (role admin, manager, staff)
export async function handleGetEmployees(req, res, next) {
  try {
    // role_id: 1-admin, 2-manager, 3-staff
    const sql = `
      SELECT 
        u.id, 
        u.name as fullName, 
        u.email, 
        u.phone as phoneNumber, 
        u.date_of_birth,
        u.role_id, 
        r.name AS role_name,
        u.created_at,
        u.updated_at
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.role_id IN (1,2,3)
      ORDER BY u.created_at DESC
    `;
    const rs = await query(sql);
    
    // Transform data to match Flutter model expectations
    const employees = rs.rows.map(row => ({
      id: row.id,
      employeeCode: `EMP${row.id.toString().slice(-3)}`,
      fullName: row.fullname || '',
      phoneNumber: row.phonenumber || '',
      email: row.email || '',
      address: '', // Not in current schema
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString() : null,
      identityCard: '', // Not in current schema
      username: row.email || '', // Use email as username
      password: '', // Don't send password
      role: row.role_id,
      roleName: row.role_name,
      isActive: true, // Default to active
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));
    
    res.json({ ok: true, data: employees });
  } catch (e) {
    console.error('Error fetching employees:', e);
    next(e);
  }
}
import { updateUserRole } from '../services/user.service.js';

// Admin cập nhật role cho user bất kỳ
export async function handleUpdateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId || ![1,2,3,4].includes(Number(roleId))) {
      return res.status(400).json({ ok: false, message: 'roleId không hợp lệ' });
    }
    const updated = await updateUserRole(id, Number(roleId));
      res.json({
        ok: true,
        data: {
          ...updated,
          role_name: updated.role_name
        }
      });
  } catch (e) {
    next(e);
  }
}
import { updateMe } from '../services/user.service.js';

export async function handleUpdateMe(req, res, next) {
  try {
    // Chỉ lấy name/phone – bỏ qua email nếu client cố tình gửi
    const { name, phone } = req.body || {};
    const updated = await updateMe(req.user.id, { name, phone });
      res.json({
        ok: true,
        data: {
          ...updated,
          role_name: updated.role_name
        }
      });
  } catch (e) {
    next(e);
  }
}
