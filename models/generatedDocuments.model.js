// models/generatedDocuments.model.js
const { query } = require("../config/db");

const GeneratedDocumentsModel = {
  // Create a new generated document
  create: async (data) => {
    const { employee_id, doc_type, html_content } = data;

    const sql = `
      INSERT INTO generated_documents (employee_id, doc_type, html_content)
      VALUES (?, ?, ?)
    `;

    const values = [employee_id, doc_type, html_content];
    const result = await query(sql, values);
    return result.insertId;
  },

  // Get all generated documents with employee info
  getAll: async (filters = {}) => {
    let sql = `
      SELECT 
        gd.*,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.employee_code,
        e.email as employee_email,
        e.designation
      FROM generated_documents gd
      LEFT JOIN hrms_employees e ON e.id = gd.employee_id
      WHERE 1=1
    `;

    const values = [];

    if (filters.doc_type) {
      sql += " AND gd.doc_type = ?";
      values.push(filters.doc_type);
    }

    if (filters.employee_id) {
      sql += " AND gd.employee_id = ?";
      values.push(filters.employee_id);
    }

    sql += " ORDER BY gd.created_at DESC";

    return await query(sql, values);
  },

  // Get document by ID
  getById: async (id) => {
    const sql = `
      SELECT 
        gd.*,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.employee_code,
        e.email as employee_email,
        e.designation
      FROM generated_documents gd
      LEFT JOIN hrms_employees e ON e.id = gd.employee_id
      WHERE gd.id = ?
    `;

    const result = await query(sql, [id]);
    return result[0];
  },

  // Get documents by employee
  getByEmployeeId: async (employee_id) => {
    const sql = `
      SELECT * FROM generated_documents
      WHERE employee_id = ?
      ORDER BY created_at DESC
    `;

    return await query(sql, [employee_id]);
  },

  // Get documents by type
  getByType: async (doc_type) => {
    const sql = `
      SELECT 
        gd.*,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.employee_code
      FROM generated_documents gd
      LEFT JOIN hrms_employees e ON e.id = gd.employee_id
      WHERE gd.doc_type = ?
      ORDER BY gd.created_at DESC
    `;

    return await query(sql, [doc_type]);
  },

  // Delete document
  delete: async (id) => {
    const sql = `DELETE FROM generated_documents WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  // Get statistics
  getStatistics: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(DISTINCT employee_id) as total_employees,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_generated,
        COUNT(CASE WHEN doc_type = 'Offer Letter' THEN 1 END) as offer_letters,
        COUNT(CASE WHEN doc_type = 'Experience Letter' THEN 1 END) as experience_letters,
        COUNT(CASE WHEN doc_type = 'Pay Slip' THEN 1 END) as pay_slips
      FROM generated_documents
    `;

    const result = await query(sql);
    return result[0];
  },
};

module.exports = GeneratedDocumentsModel;
