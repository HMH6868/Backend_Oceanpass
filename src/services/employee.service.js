import { pool } from '../db.js';

export const getEmployees = async () => {
  try {
    const query = `
      SELECT 
        e.id,
        e.employee_code,
        e.department,
        e.position,
        e.hired_at,
        e.is_active,
        e.created_at,
        e.updated_at,
        u.name as full_name,
        u.email,
        u.phone as phone_number,
        u.date_of_birth,
        u.role_id,
        r.name as role_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('admin', 'manager', 'staff')
      ORDER BY e.created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const updateEmployeeRole = async (employeeId, roleId) => {
  try {
    const query = `
      UPDATE users 
      SET role_id = $1, updated_at = CURRENT_TIMESTAMP
      FROM employees e
      WHERE e.id = $2 AND e.user_id = users.id
      RETURNING users.name, users.email, users.phone, users.role_id, r.name as role_name
    `;
    
    const roleQuery = 'SELECT name FROM roles WHERE id = $1';
    const roleResult = await pool.query(roleQuery, [roleId]);
    
    if (roleResult.rows.length === 0) {
      throw new Error('Role không tồn tại');
    }
    
    const result = await pool.query(query, [roleId, employeeId]);
    
    if (result.rows.length === 0) {
      throw new Error('Không tìm thấy nhân viên');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating employee role:', error);
    throw error;
  }
};
