const { query } = require("../config/db");

const DocumentTemplateModel = {
  // ============================================
  // CREATE TEMPLATE
  // ============================================
  createTemplate: async (data) => {
    const { name, category, description, html_content, variables, logo_url } =
      data;

    const sql = `
      INSERT INTO document_templates
      (name, category, description, html_content, variables, logo_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      category || "Other",
      description || null,
      html_content,
      JSON.stringify(variables || []),
      logo_url || null,
    ];

    const result = await query(sql, values);
    return result.insertId;
  },

  // ============================================
  // GET ALL
  // ============================================
  getAll: async () => {
    const sql = `
      SELECT * FROM document_templates
      WHERE is_active = 1
      ORDER BY id DESC
    `;

    return await query(sql);
  },

  // ============================================
  // GET BY ID
  // ============================================
  getById: async (id) => {
    const sql = `
      SELECT * FROM document_templates
      WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result[0];
  },

  // In documentTemplates.model.js
  updateTemplate: async (id, data) => {
    const { name, category, description, html_content, variables, logo_url } =
      data;

    const sql = `
    UPDATE document_templates
    SET
      name = ?,
      category = ?,
      description = ?,
      html_content = ?,
      variables = ?,
      logo_url = COALESCE(?, logo_url),
      updated_at = NOW()
    WHERE id = ?
  `;

    const values = [
      name,
      category,
      description,
      html_content,
      JSON.stringify(variables || []),
      logo_url || null,
      id,
    ];

    const result = await query(sql, values);
    return result.affectedRows;
  },

  // ============================================
  // DELETE (SOFT DELETE)
  // ============================================
  deleteTemplate: async (id) => {
    const sql = `
      UPDATE document_templates
      SET is_active = 0
      WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result.affectedRows;
  },
};

module.exports = DocumentTemplateModel;
