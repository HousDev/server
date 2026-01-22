// models/departmentModel.js
const { query } = require("../config/db");

class Department {
  // Get all departments
  static async findAll() {
    const rows = await query(`
      SELECT d.*, u.full_name as manager_name
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      WHERE d.is_active = TRUE
      ORDER BY d.name ASC
    `);
    return rows.map((row) => this.normalizeRow(row));
  }

  // Get department by ID
  static async findById(id) {
    const rows = await query(
      `
      SELECT d.*, u.full_name as manager_name
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      WHERE d.id = ? AND d.is_active = TRUE
      LIMIT 1
    `,
      [id],
    );
    return rows.length ? this.normalizeRow(rows[0]) : null;
  }

  // Get department by code
  static async findByCode(code) {
    const rows = await query(
      `
      SELECT d.*, u.full_name as manager_name
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      WHERE d.code = ? AND d.is_active = TRUE
      LIMIT 1
    `,
      [code.toUpperCase()],
    );
    return rows.length ? this.normalizeRow(rows[0]) : null;
  }

  // Create new department
  static async create({
    name,
    code,
    description = null,
    manager_id = null,
    is_active = true,
  }) {
    const sql = `
      INSERT INTO departments (name, code, description, manager_id, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      name,
      code.toUpperCase(),
      description,
      manager_id,
      is_active ? 1 : 0,
    ]);

    return await this.findById(result.insertId);
  }

  // Update department
  static async update(id, { name, code, description, manager_id, is_active }) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push("name = ?");
      params.push(name);
    }
    if (code !== undefined) {
      fields.push("code = ?");
      params.push(code.toUpperCase());
    }
    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description);
    }
    if (manager_id !== undefined) {
      fields.push("manager_id = ?");
      params.push(manager_id);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    const sql = `UPDATE departments SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    params.push(id);

    await query(sql, params);
    return await this.findById(id);
  }

  // Soft delete department (set is_active = false)
  static async delete(id) {
    await query("DELETE FROM departments WHERE id = ?", [id]);
    return true;
  }

  // Hard delete department
  static async hardDelete(id) {
    await query("DELETE FROM departments WHERE id = ?", [id]);
    return true;
  }

  // Toggle active status
  static async toggleActive(id) {
    await query(
      "UPDATE departments SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );
    return await this.findById(id);
  }

  // Check if department exists
  static async exists(id) {
    const rows = await query(
      "SELECT COUNT(*) as count FROM departments WHERE id = ? AND is_active = TRUE",
      [id],
    );
    return rows[0].count > 0;
  }

  // Search departments
  static async search(searchTerm) {
    const rows = await query(
      `
      SELECT d.*, u.full_name as manager_name
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      WHERE d.is_active = TRUE 
      AND (d.name LIKE ? OR d.code LIKE ? OR d.description LIKE ?)
      ORDER BY d.name ASC
    `,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
    );
    return rows.map((row) => this.normalizeRow(row));
  }

  // Get all active managers
  static async getActiveManagers() {
    const rows = await query(`
      SELECT id, full_name, email, role
      FROM users 
      WHERE is_active = TRUE 
      AND (role = 'MANAGER' OR role = 'ADMIN')
      ORDER BY full_name ASC
    `);
    return rows;
  }

  // Get department statistics
  static async getStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_departments,
        SUM(is_active = 1) as active_departments,
        SUM(is_active = 0) as inactive_departments,
        COUNT(DISTINCT manager_id) as departments_with_manager
      FROM departments
    `);
    return stats[0];
  }

  // Helper method to normalize row data
  static normalizeRow(row) {
    if (!row) return row;

    row.is_active = Boolean(row.is_active);

    // Format dates if needed
    if (row.created_at) {
      row.created_at = new Date(row.created_at).toISOString();
    }
    if (row.updated_at) {
      row.updated_at = new Date(row.updated_at).toISOString();
    }

    return row;
  }
}

module.exports = Department;
