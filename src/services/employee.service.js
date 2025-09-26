import { query } from '../db.js';

export async function getEmployees() {
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role_id,
      u.avatar,
      u.date_of_birth,
      u.created_at,
      u.updated_at,
      r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name IN ('admin', 'manager', 'staff')
    ORDER BY u.created_at DESC
  `;
  
  const result = await query(sql);
  return result.rows;
}

export async function getCustomers() {
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role_id,
      u.avatar,
      u.date_of_birth,
      u.created_at,
      u.updated_at,
      r.name as role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'customer'
    ORDER BY u.created_at DESC
  `;
  
  const result = await query(sql);
  return result.rows;
}

export async function updateEmployeeRole(userId, roleId) {
  const sql = `
    UPDATE users 
    SET role_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [roleId, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('Employee not found');
  }

  return result.rows[0];
}
