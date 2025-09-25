import { pool } from '../db.js';

export const handleGetEmployees = async (req, res, next) => {
  try {
    console.log('Getting employees from users table (admin, manager, staff)...');
    
    // Query users table với roles admin, manager, staff
    const query = `
      SELECT 
        u.id,
        u.name as full_name,
        u.email,
        u.phone as phone_number,
        u.date_of_birth,
        u.role_id,
        r.name as role_name,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('admin', 'manager', 'staff')
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    console.log('Employees query result:', result.rows);
    
    const employees = result.rows.map(row => ({
      id: row.id,
      employeeCode: `EMP${row.id.substring(0, 4)}`, // Generate employee code from user ID
      fullName: row.full_name,
      phoneNumber: row.phone_number || '',
      email: row.email,
      address: '', // users table không có address
      dateOfBirth: row.date_of_birth,
      identityCard: '', // users table không có identity_card
      username: row.email, // sử dụng email làm username
      password: '', // không trả về password
      role: row.role_id,
      roleName: row.role_name,
      isActive: true, // default active
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    res.json({
      ok: true,
      data: employees
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      ok: false,
      message: 'Lỗi lấy danh sách nhân viên',
      error: error.message
    });
  }
};

export const handleUpdateEmployeeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    
    console.log(`Updating user ${id} role to ${roleId}`);
    
    // Update role trực tiếp trong users table
    const query = `
      UPDATE users 
      SET role_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING name, email, phone, role_id, r.name as role_name
    `;
    
    const roleQuery = 'SELECT name FROM roles WHERE id = $1';
    const roleResult = await pool.query(roleQuery, [roleId]);
    
    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Role không tồn tại'
      });
    }
    
    const result = await pool.query(query, [roleId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Không tìm thấy user'
      });
    }
    
    const updatedUser = result.rows[0];
    
    res.json({
      ok: true,
      data: {
        id: id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role_id: updatedUser.role_id,
        role_name: updatedUser.role_name
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      ok: false,
      message: 'Lỗi cập nhật vai trò user',
      error: error.message
    });
  }
};

export const testDatabase = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name IN ('admin', 'manager', 'staff')
    `);
    const employeeCount = result.rows[0].count;
    
    res.json({
      ok: true,
      message: 'Database connection OK',
      employeeCount: employeeCount
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      ok: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
};
