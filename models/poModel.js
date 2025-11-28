// models/poModel.js
const { pool } = require("../config/db");

async function initPOTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS purchase_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_number VARCHAR(100) NOT NULL UNIQUE,
      vendor_id INT,
      project_id VARCHAR(100),
      po_type_id VARCHAR(100),
      po_date DATE,
      delivery_date DATE,
      is_interstate TINYINT(1) DEFAULT 0,
      subtotal DECIMAL(14,2) DEFAULT 0,
      discount_percentage DECIMAL(6,2) DEFAULT 0,
      discount_amount DECIMAL(14,2) DEFAULT 0,
      taxable_amount DECIMAL(14,2) DEFAULT 0,
      cgst_amount DECIMAL(14,2) DEFAULT 0,
      sgst_amount DECIMAL(14,2) DEFAULT 0,
      igst_amount DECIMAL(14,2) DEFAULT 0,
      total_gst_amount DECIMAL(14,2) DEFAULT 0,
      grand_total DECIMAL(14,2) DEFAULT 0,
      payment_terms_id VARCHAR(100),
      advance_amount DECIMAL(14,2) DEFAULT 0,
      total_paid DECIMAL(14,2) DEFAULT 0,
      balance_amount DECIMAL(14,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'draft',
      material_status VARCHAR(50) DEFAULT 'pending',
      payment_status VARCHAR(50) DEFAULT 'pending',
      selected_terms_ids TEXT,
      terms_and_conditions TEXT,
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      item_id VARCHAR(100),
      item_code VARCHAR(100),
      item_name VARCHAR(255),
      description TEXT,
      hsn_code VARCHAR(50),
      quantity DECIMAL(14,3) DEFAULT 0,
      unit VARCHAR(50),
      rate DECIMAL(14,2) DEFAULT 0,
      amount DECIMAL(14,2) DEFAULT 0,
      gst_rate DECIMAL(6,2) DEFAULT 0,
      gst_amount DECIMAL(14,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS po_material_tracking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      item_id VARCHAR(100),
      item_description VARCHAR(255),
      quantity_ordered DECIMAL(14,3) DEFAULT 0,
      quantity_received DECIMAL(14,3) DEFAULT 0,
      quantity_pending DECIMAL(14,3) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS po_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      payment_type VARCHAR(50),
      amount DECIMAL(14,2) DEFAULT 0,
      due_date DATE,
      paid_date DATE,
      status VARCHAR(50) DEFAULT 'pending',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS po_sequences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      prefix VARCHAR(50) DEFAULT 'PO',
      last_number INT DEFAULT 0,
      year INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    // ensure at least one sequence row
    const [rows] = await conn.query("SELECT COUNT(*) AS cnt FROM po_sequences");
    if (Array.isArray(rows) && rows[0] && rows[0].cnt === 0) {
      await conn.query(
        "INSERT INTO po_sequences (prefix, last_number, year) VALUES (?, ?, ?)",
        ["PO", 0, new Date().getFullYear()]
      );
    }
  } finally {
    conn.release();
  }
}

module.exports = { initPOTables };
