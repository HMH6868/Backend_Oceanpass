import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // nếu dùng Render/Neon cần bật
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
