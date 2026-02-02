const { query } = require("../config/db");

class Designation {
  // Get all designations with department and role info
  static async findAll() {
    const rows = await query(`
      SELECT 
        ds.*,
        d.name as department_name,
        d.code as department_code,
        r.name as role_name,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name
      FROM designations ds
      JOIN departments d ON ds.department_id = d.id AND d.is_active = 1
      JOIN roles r ON ds.role_id = r.id AND r.is_active = 1
      LEFT JOIN users u1 ON ds.created_by = u1.id
      LEFT JOIN users u2 ON ds.updated_by = u2.id
      ORDER BY ds.is_active DESC, d.name, r.name, ds.hierarchy_level DESC, ds.name
    `);
    return rows.map(row => this.normalizeRow(row));
  }

  // Get by ID
  static async findById(id) {
    const rows = await query(
      `
      SELECT ds.*,
             d.name as department_name,
             d.code as department_code,
             r.name as role_name
      FROM designations ds
      JOIN departments d ON ds.department_id = d.id AND d.is_active = 1
      JOIN roles r ON ds.role_id = r.id AND r.is_active = 1
      WHERE ds.id = ?
      LIMIT 1
      `,
      [id]
    );
    return rows.length ? this.normalizeRow(rows[0]) : null;
  }

  // Get designations by department and role
  static async findByDepartmentAndRole(departmentId, roleId) {
    const rows = await query(
      `
      SELECT ds.*,
             d.name as department_name,
             r.name as role_name
      FROM designations ds
      JOIN departments d ON ds.department_id = d.id AND d.is_active = 1
      JOIN roles r ON ds.role_id = r.id AND r.is_active = 1
      WHERE ds.department_id = ? 
      AND ds.role_id = ? 
      ORDER BY ds.is_active DESC, ds.hierarchy_level DESC, ds.name
      `,
      [departmentId, roleId]
    );
    return rows.map(row => this.normalizeRow(row));
  }

  // Get designations by department
  static async findByDepartment(departmentId) {
    const rows = await query(
      `
      SELECT ds.*,
             d.name as department_name,
             r.name as role_name
      FROM designations ds
      JOIN departments d ON ds.department_id = d.id AND d.is_active = 1
      JOIN roles r ON ds.role_id = r.id AND r.is_active = 1
      WHERE ds.department_id = ? 
      ORDER BY ds.is_active DESC, r.name, ds.hierarchy_level DESC, ds.name
      `,
      [departmentId]
    );
    return rows.map(row => this.normalizeRow(row));
  }

  // Get designations by role
  static async findByRole(roleId) {
    const rows = await query(
      `
      SELECT ds.*,
             d.name as department_name,
             r.name as role_name
      FROM designations ds
      JOIN departments d ON ds.department_id = d.id AND d.is_active = 1
      JOIN roles r ON ds.role_id = r.id AND r.is_active = 1
      WHERE ds.role_id = ? 
      ORDER BY ds.is_active DESC, d.name, ds.hierarchy_level DESC, ds.name
      `,
      [roleId]
    );
    return rows.map(row => this.normalizeRow(row));
  }

  // Check if designation name exists for same department-role
  static async existsInDepartmentRole(departmentId, roleId, name) {
    const rows = await query(
      `
      SELECT * FROM designations 
      WHERE department_id = ? 
      AND role_id = ? 
      AND name = ?
      LIMIT 1
      `,
      [departmentId, roleId, name]
    );
    return rows.length > 0;
  }

  // Create designation
  static async create({
    name,
    department_id,
    role_id,
    hierarchy_level = 0,
    is_active = true,
    created_by = null
  }) {
    // Check if name exists for same department-role
    const existingByName = await this.existsInDepartmentRole(department_id, role_id, name);
    if (existingByName) {
      throw new Error('Designation name already exists for this department-role combination');
    }

    // Verify department-role mapping exists
    const deptRoleExists = await query(
      "SELECT id FROM department_roles WHERE department_id = ? AND role_id = ? AND is_active = TRUE LIMIT 1",
      [department_id, role_id]
    );
    
    if (deptRoleExists.length === 0) {
      throw new Error('Role is not assigned to this department');
    }

    const sql = `
      INSERT INTO designations 
      (name, department_id, role_id, hierarchy_level, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      name,
      department_id,
      role_id,
      hierarchy_level,
      is_active ? 1 : 0,
      created_by
    ]);

    return await this.findById(result.insertId);
  }

  // Update designation
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    const allowedFields = ['name', 'hierarchy_level', 'is_active', 'updated_by'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(updateData[field]);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE designations SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);

    await query(sql, params);
    return await this.findById(id);
  }

  // ✅ FIXED: Permanent (hard) delete - actually removes the row from database
  static async delete(id) {
    const result = await query("DELETE FROM designations WHERE id = ?", [id]);
    // result.affectedRows === 0 means row didn't exist
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id) {
    // First get current status
    const current = await this.findById(id);
    if (!current) {
      throw new Error('Designation not found');
    }
    
    // Toggle the status
    const newStatus = !current.is_active;
    await query(
      "UPDATE designations SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newStatus ? 1 : 0, id]
    );
    
    // Return updated designation
    return await this.findById(id);
  }

  // Get statistics
  static async getStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_designations,
        SUM(is_active = 1) as active_designations,
        SUM(is_active = 0) as inactive_designations,
        COUNT(DISTINCT CONCAT(department_id, '-', role_id)) as unique_department_roles
      FROM designations
    `);
    return stats[0];
  }

  // Search designations
  static async search(searchTerm) {
    const rows = await query(
      `
      SELECT ds.*,
             d.name as department_name,
             d.code as department_code,
             r.name as role_name
      FROM designations ds
      JOIN departments d ON ds.department_id = d.id AND d.is_active = 1
      JOIN roles r ON ds.role_id = r.id AND r.is_active = 1
      WHERE (ds.name LIKE ? OR d.name LIKE ? OR r.name LIKE ?)
      ORDER BY ds.is_active DESC, d.name, r.name, ds.name
      `,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows.map(row => this.normalizeRow(row));
  }

  // Normalize row
  static normalizeRow(row) {
    if (!row) return row;
    row.is_active = Boolean(row.is_active);
    row.hierarchy_level = parseInt(row.hierarchy_level) || 0;
    return row;
  }
}

module.exports = Designation;