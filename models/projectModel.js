// models/projectModel.js
const { pool } = require("../config/db");

async function initProjectTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      location VARCHAR(255) NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      status VARCHAR(50) DEFAULT 'active',
      is_active TINYINT(1) DEFAULT 1,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const conn = await pool.getConnection();
  try {
    await conn.query(sql);
    console.log("projects table initialized");
  } catch (err) {
    console.error("initProjectTable error", err);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { initProjectTable };
