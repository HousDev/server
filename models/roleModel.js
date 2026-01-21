// models/roleModel.js
const { query } = require("../config/db"); // ✅ query import करें

class Role {
  // Get all roles
  static async findAll() {
    const rows = await query(
      `SELECT id, name, description, permissions, is_active, created_at, updated_at
       FROM roles 
       ORDER BY name ASC`,
    );
    return rows.map((row) => this.normalizePermissions(row));
  }

  // Find role by ID
  static async findById(id) {
    const rows = await query(
      `SELECT id, name, description, permissions, is_active, created_at, updated_at
       FROM roles WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows.length ? this.normalizePermissions(rows[0]) : null;
  }

  // Find role by name
  static async findByName(name) {
    const rows = await query(
      `SELECT id, name, description, permissions, is_active, created_at, updated_at
       FROM roles WHERE name = ? LIMIT 1`,
      [name],
    );
    return rows.length ? this.normalizePermissions(rows[0]) : null;
  }

  // Create new role
  static async create({
    name,
    description,
    permissions = {},
    is_active = true,
  }) {
    const sql = `INSERT INTO roles (name, description, permissions, is_active)
                 VALUES (?, ?, ?, ?)`;

    const result = await query(sql, [
      name,
      description || null,
      JSON.stringify(permissions),
      is_active ? 1 : 0,
    ]);

    return await this.findById(result.insertId);
  }

  // Update role
  static async update(id, { name, description, permissions, is_active }) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push("name = ?");
      params.push(name);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description);
    }
    if (permissions !== undefined) {
      fields.push("permissions = ?");
      params.push(JSON.stringify(permissions));
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    const sql = `UPDATE roles SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);
    await query(sql, params);

    return await this.findById(id);
  }

  // Delete role
  static async delete(id) {
    await query("DELETE FROM roles WHERE id = ?", [id]);
    return true;
  }

  // Toggle active status
  static async toggleActive(id) {
    await query("UPDATE roles SET is_active = NOT is_active WHERE id = ?", [
      id,
    ]);
    return await this.findById(id);
  }

  // Get paginated roles
  static async findAllPaginated({
    page = 1,
    limit = 10,
    search,
    is_active,
  } = {}) {
    let conditions = [];
    let params = [];

    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (is_active !== undefined) {
      conditions.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM roles ${whereClause}`,
      params,
    );
    const total = countResult[0].total;

    // Get paginated data
    const offset = (page - 1) * limit;
    const rows = await query(
      `SELECT id, name, description, permissions, is_active, created_at, updated_at
       FROM roles ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      data: rows.map((row) => this.normalizePermissions(row)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Search roles
  static async search(queryText, limit = 10) {
    const rows = await query(
      `SELECT id, name, description, permissions, is_active, created_at, updated_at
       FROM roles 
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY name ASC
       LIMIT ?`,
      [`%${queryText}%`, `%${queryText}%`, limit],
    );
    return rows.map((row) => this.normalizePermissions(row));
  }

  // Get role statistics
  static async getStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_roles,
        SUM(is_active = 1) as active_roles,
        SUM(is_active = 0) as inactive_roles
      FROM roles
    `);

    const permissionsStats = await query(`
      SELECT 
        JSON_LENGTH(permissions) as permission_count,
        COUNT(*) as role_count
      FROM roles
      GROUP BY JSON_LENGTH(permissions)
      ORDER BY permission_count
    `);

    return {
      ...stats[0],
      permissions_distribution: permissionsStats,
    };
  }

  // Get all available permissions (static list)
  static async getAllPermissions() {
    return {
      users: ["create", "read", "update", "delete", "manage"],
      roles: ["create", "read", "update", "delete", "assign"],
      vendors: ["create", "read", "update", "delete", "approve"],
      products: ["create", "read", "update", "delete", "manage"],
      orders: ["create", "read", "update", "delete", "process"],
      reports: ["view", "export", "generate"],
      settings: ["read", "update"],
    };
  }

  // Helper method to normalize permissions
  static normalizePermissions(row) {
    if (!row) return row;

    try {
      if (typeof row.permissions === "string") {
        row.permissions = JSON.parse(row.permissions);
      }
    } catch (e) {
      row.permissions = {};
    }

    row.is_active = Boolean(row.is_active);
    return row;
  }
}

module.exports = Role;
