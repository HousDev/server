// models/vendorModel.js
const db = require("../config/db");

async function initVendorTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_name VARCHAR(150) NOT NULL,
      pan_number VARCHAR(10),
      gst_number VARCHAR(15),
      contact_person_name VARCHAR(150) NOT NULL,
      contact_person_phone VARCHAR(25) NOT NULL,
      contact_person_email VARCHAR(255) NOT NULL,
      office_street TEXT,
      office_city VARCHAR(150),
      office_state VARCHAR(150),
      office_pincode VARCHAR(10),
      office_country VARCHAR(100) DEFAULT 'India',
      company_email VARCHAR(255),
      company_phone VARCHAR(25),
      manager_name VARCHAR(150),
      manager_email VARCHAR(255),
      manager_phone VARCHAR(25),
      phone_country_code VARCHAR(10) DEFAULT '+91',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

module.exports = { initVendorTable };
