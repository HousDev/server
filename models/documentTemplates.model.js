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
      (name, category, description, html_content, variables, logo_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 0)
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
      SELECT * FROM document_templates where is_deleted = 0
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

  approveTemplate: async (id, data) => {
    const sql = `
      update document_templates set approved_by = ?,approved_at = ?, status = "approved"
      WHERE id = ?
    `;

    const result = await query(sql, [data.approved_by, data.approved_at, id]);
    return result;
  },

  activeInactiveTemplateModel: async (id, is_active) => {
    const sql = `
      update document_templates set is_active = ?
      WHERE id = ?
    `;

    const result = await query(sql, [Number(is_active) === 1 ? 0 : 1, id]);
    return result;
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
      is_active = 0,
      status = "pending",
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

  rejectDocumentTemplateModel: async (id, data) => {
    const sql = `
    UPDATE document_templates
    SET
       approved_by = ?,
        approved_at = ?,
        rejection_reason = ?,
        status = "rejected"
    WHERE id = ?
  `;

    const values = [
      data.approved_by,
      data.approved_at,
      data.rejection_reason,
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
      SET is_deleted = 1
      WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result.affectedRows;
  },
};

module.exports = DocumentTemplateModel;
