// // models/departmentModel.js
// const { query } = require("../config/db");

// class Department {
//   // Get all departments
//   static async findAll() {
//     const rows = await query(`
//       SELECT d.*, u.full_name as manager_name
//       FROM departments d
//       LEFT JOIN users u ON d.manager_id = u.id
//       WHERE d.is_active = TRUE
//       ORDER BY d.name ASC
//     `);
//     return rows.map((row) => this.normalizeRow(row));
//   }

//   // Get department by ID
//   static async findById(id) {
//     const rows = await query(
//       `
//       SELECT d.*, u.full_name as manager_name
//       FROM departments d
//       LEFT JOIN users u ON d.manager_id = u.id
//       WHERE d.id = ? AND d.is_active = TRUE
//       LIMIT 1
//     `,
//       [id],
//     );
//     return rows.length ? this.normalizeRow(rows[0]) : null;
//   }

//   // Get department by code
//   static async findByCode(code) {
//     const rows = await query(
//       `
//       SELECT d.*, u.full_name as manager_name
//       FROM departments d
//       LEFT JOIN users u ON d.manager_id = u.id
//       WHERE d.code = ? AND d.is_active = TRUE
//       LIMIT 1
//     `,
//       [code.toUpperCase()],
//     );
//     return rows.length ? this.normalizeRow(rows[0]) : null;
//   }

//   // Create new department
//   static async create({
//     name,
//     code,
//     description = null,
//     manager_id = null,
//     is_active = true,
//   }) {
//     const sql = `
//       INSERT INTO departments (name, code, description, manager_id, is_active)
//       VALUES (?, ?, ?, ?, ?)
//     `;

//     const result = await query(sql, [
//       name,
//       code.toUpperCase(),
//       description,
//       manager_id,
//       is_active ? 1 : 0,
//     ]);

//     return await this.findById(result.insertId);
//   }

//   // Update department
//   static async update(id, { name, code, description, manager_id, is_active }) {
//     const fields = [];
//     const params = [];

//     if (name !== undefined) {
//       fields.push("name = ?");
//       params.push(name);
//     }
//     if (code !== undefined) {
//       fields.push("code = ?");
//       params.push(code.toUpperCase());
//     }
//     if (description !== undefined) {
//       fields.push("description = ?");
//       params.push(description);
//     }
//     if (manager_id !== undefined) {
//       fields.push("manager_id = ?");
//       params.push(manager_id);
//     }
//     if (is_active !== undefined) {
//       fields.push("is_active = ?");
//       params.push(is_active ? 1 : 0);
//     }

//     if (fields.length === 0) {
//       return await this.findById(id);
//     }

//     const sql = `UPDATE departments SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
//     params.push(id);

//     await query(sql, params);
//     return await this.findById(id);
//   }

//   // Soft delete department (set is_active = false)
//   static async delete(id) {
//     await query("DELETE FROM departments WHERE id = ?", [id]);
//     return true;
//   }

//   // Hard delete department
//   static async hardDelete(id) {
//     await query("DELETE FROM departments WHERE id = ?", [id]);
//     return true;
//   }

//   // Toggle active status
//   static async toggleActive(id) {
//     await query(
//       "UPDATE departments SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
//       [id],
//     );
//     return await this.findById(id);
//   }

//   // Check if department exists
//   static async exists(id) {
//     const rows = await query(
//       "SELECT COUNT(*) as count FROM departments WHERE id = ? AND is_active = TRUE",
//       [id],
//     );
//     return rows[0].count > 0;
//   }

//   // Search departments
//   static async search(searchTerm) {
//     const rows = await query(
//       `
//       SELECT d.*, u.full_name as manager_name
//       FROM departments d
//       LEFT JOIN users u ON d.manager_id = u.id
//       WHERE d.is_active = TRUE 
//       AND (d.name LIKE ? OR d.code LIKE ? OR d.description LIKE ?)
//       ORDER BY d.name ASC
//     `,
//       [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
//     );
//     return rows.map((row) => this.normalizeRow(row));
//   }

//   // Get all active managers
//   static async getActiveManagers() {
//     const rows = await query(`
//       SELECT id, full_name, email, role
//       FROM users 
//       WHERE is_active = TRUE 
//       AND (role = 'MANAGER' OR role = 'ADMIN')
//       ORDER BY full_name ASC
//     `);
//     return rows;
//   }

//   // Get department statistics
//   static async getStats() {
//     const stats = await query(`
//       SELECT 
//         COUNT(*) as total_departments,
//         SUM(is_active = 1) as active_departments,
//         SUM(is_active = 0) as inactive_departments,
//         COUNT(DISTINCT manager_id) as departments_with_manager
//       FROM departments
//     `);
//     return stats[0];
//   }

//   // Helper method to normalize row data
//   static normalizeRow(row) {
//     if (!row) return row;

//     row.is_active = Boolean(row.is_active);

//     // Format dates if needed
//     if (row.created_at) {
//       row.created_at = new Date(row.created_at).toISOString();
//     }
//     if (row.updated_at) {
//       row.updated_at = new Date(row.updated_at).toISOString();
//     }

//     return row;
//   }
// }

const { query, pool } = require("../config/db");
const { v4: uuidv4 } = require('uuid'); // ✅ ADD THIS IMPORT

class Department {
  // Get all departments WITH their assigned roles (INCLUDING INACTIVE)
  static async findAll() {
    try {
      const rows = await query(`
        SELECT 
          d.*, 
          u.full_name as manager_name,
          GROUP_CONCAT(DISTINCT dr.role_id) as role_ids,
          GROUP_CONCAT(DISTINCT r.name) as role_names
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
        LEFT JOIN department_roles dr ON d.id = dr.department_id AND dr.is_active = 1
        LEFT JOIN roles r ON dr.role_id = r.id AND r.is_active = 1
        GROUP BY d.id
        ORDER BY d.name ASC
      `);
      return rows.map((row) => this.normalizeRow(row));
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  // Get department by ID with roles (includes inactive departments)
  static async findById(id) {
    try {
      const rows = await query(
        `
        SELECT 
          d.*, 
          u.full_name as manager_name,
          GROUP_CONCAT(DISTINCT dr.role_id) as role_ids,
          GROUP_CONCAT(DISTINCT r.name) as role_names
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
        LEFT JOIN department_roles dr ON d.id = dr.department_id AND dr.is_active = 1
        LEFT JOIN roles r ON dr.role_id = r.id AND r.is_active = 1
        WHERE d.id = ?
        GROUP BY d.id
        LIMIT 1
        `,
        [id]
      );
      return rows.length ? this.normalizeRow(rows[0]) : null;
    } catch (error) {
      console.error(`Error in findById ${id}:`, error);
      throw error;
    }
  }

  // Get department by code with roles (includes inactive departments)
  static async findByCode(code) {
    try {
      const rows = await query(
        `
        SELECT 
          d.*, 
          u.full_name as manager_name,
          GROUP_CONCAT(DISTINCT dr.role_id) as role_ids,
          GROUP_CONCAT(DISTINCT r.name) as role_names
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
        LEFT JOIN department_roles dr ON d.id = dr.department_id AND dr.is_active = 1
        LEFT JOIN roles r ON dr.role_id = r.id AND r.is_active = 1
        WHERE d.code = ?
        GROUP BY d.id
        LIMIT 1
        `,
        [code.toUpperCase()]
      );
      return rows.length ? this.normalizeRow(rows[0]) : null;
    } catch (error) {
      console.error(`Error in findByCode ${code}:`, error);
      throw error;
    }
  }

  // ✅ CORRECTED: Create department WITH roles - Generate UUID in Node.js
  static async createWithRoles({
    name,
    code,
    description = null,
    manager_id = null,
    is_active = true,
    role_ids = []
  }) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // ✅ CRITICAL FIX: Generate UUID in Node.js BEFORE inserting
      const departmentId = uuidv4();
      console.log('✅ Generated department UUID:', departmentId);

      // 1. Create department with explicit ID
      const deptSql = `
        INSERT INTO departments (id, name, code, description, manager_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(deptSql, [
        departmentId,  // ✅ Pass the UUID we generated
        name,
        code.toUpperCase(),
        description,
        manager_id,
        is_active ? 1 : 0
      ]);
      
      console.log('✅ Successfully created department with ID:', departmentId);

      // 2. Create department-role mappings (if any roles provided)
      if (role_ids && role_ids.length > 0) {
        // Validate and prepare role IDs
        const validRoleIds = role_ids
          .map(roleId => parseInt(roleId))
          .filter(roleId => !isNaN(roleId) && roleId > 0);
        
        if (validRoleIds.length > 0) {
          console.log('✅ Mapping roles:', validRoleIds, 'to department:', departmentId);

          // Create placeholders for each role
          const placeholders = validRoleIds.map(() => '(?, ?, 1)').join(', ');
          const values = validRoleIds.flatMap(roleId => [departmentId, roleId]);
          
          const mappingSql = `
            INSERT INTO department_roles (department_id, role_id, is_active)
            VALUES ${placeholders}
          `;
          
          await connection.execute(mappingSql, values);
          console.log('✅ Successfully mapped roles to department');
        }
      }

      await connection.commit();
      console.log('✅ Transaction committed successfully');

      // 3. Return department with roles
      return await this.findById(departmentId);
      
    } catch (error) {
      await connection.rollback();
      console.error("❌ Error in createWithRoles:", error);
      console.error("❌ Error details:", {
        name,
        code,
        role_ids,
        sqlMessage: error.sqlMessage,
        errorCode: error.code
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  // ✅ Update department WITH roles
  static async updateWithRoles(id, updateData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const { name, code, description, manager_id, is_active, role_ids } = updateData;

      // 1. Update department details
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

      if (fields.length > 0) {
        const sql = `UPDATE departments SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        params.push(id);
        await connection.execute(sql, params);
      }

      // 2. Update department-role mappings if role_ids provided
      if (role_ids !== undefined) {
        // Delete existing mappings
        await connection.execute(
          "DELETE FROM department_roles WHERE department_id = ?",
          [id]
        );

        // Insert new mappings (if any roles provided)
        if (role_ids && role_ids.length > 0) {
          // Validate and prepare role IDs
          const validRoleIds = role_ids
            .map(roleId => parseInt(roleId))
            .filter(roleId => !isNaN(roleId) && roleId > 0);
          
          if (validRoleIds.length > 0) {
            // Create placeholders for each role
            const placeholders = validRoleIds.map(() => '(?, ?, 1)').join(', ');
            const values = validRoleIds.flatMap(roleId => [id, roleId]);
            
            const mappingSql = `
              INSERT INTO department_roles (department_id, role_id, is_active)
              VALUES ${placeholders}
            `;
            
            await connection.execute(mappingSql, values);
          }
        }
      }

      await connection.commit();

      // 3. Return updated department with roles
      return await this.findById(id);
      
    } catch (error) {
      await connection.rollback();
      console.error(`Error in updateWithRoles ${id}:`, error);
      console.error("Error details:", {
        id,
        updateData,
        sqlMessage: error.sqlMessage
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  // ✅ CORRECTED: Simple create method - Generate UUID in Node.js
  static async create({
    name,
    code,
    description = null,
    manager_id = null,
    is_active = true,
  }) {
    try {
      const departmentId = uuidv4(); // ✅ Generate UUID
      
      const sql = `
        INSERT INTO departments (id, name, code, description, manager_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await query(sql, [
        departmentId,  // ✅ Pass the UUID
        name,
        code.toUpperCase(),
        description,
        manager_id,
        is_active ? 1 : 0,
      ]);

      return await this.findById(departmentId);
    } catch (error) {
      console.error("Error in create:", error);
      throw error;
    }
  }

  // Simple update method for backward compatibility
  static async update(id, updateData) {
    try {
      const { name, code, description, manager_id, is_active } = updateData;
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
    } catch (error) {
      console.error(`Error in update ${id}:`, error);
      throw error;
    }
  }

  // Get all active roles (for dropdown)
  static async getAvailableRoles() {
    try {
      const rows = await query(`
        SELECT id, name, description
        FROM roles 
        WHERE is_active = TRUE
        ORDER BY name ASC
      `);
      return rows;
    } catch (error) {
      console.error("Error in getAvailableRoles:", error);
      throw error;
    }
  }

  // Get roles by department
  static async getRolesByDepartment(departmentId) {
    try {
      const rows = await query(
        `
        SELECT r.*
        FROM roles r
        JOIN department_roles dr ON r.id = dr.role_id
        WHERE dr.department_id = ? 
        AND dr.is_active = TRUE 
        AND r.is_active = TRUE
        ORDER BY r.name
        `,
        [departmentId]
      );
      return rows;
    } catch (error) {
      console.error(`Error in getRolesByDepartment ${departmentId}:`, error);
      throw error;
    }
  }

  // Delete department (soft delete)
  static async delete(id) {
    try {
      await query("DELETE FROM departments WHERE id = ?", [id]);
      return true;
    } catch (error) {
      console.error(`Error in delete ${id}:`, error);
      throw error;
    }
  }

  // Hard delete department
  static async hardDelete(id) {
    try {
      await query("DELETE FROM departments WHERE id = ?", [id]);
      return true;
    } catch (error) {
      console.error(`Error in hardDelete ${id}:`, error);
      throw error;
    }
  }

  // Toggle active status
  static async toggleActive(id) {
    try {
      await query(
        "UPDATE departments SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );
      return await this.findById(id);
    } catch (error) {
      console.error(`Error in toggleActive ${id}:`, error);
      throw error;
    }
  }

  // Check if department exists (regardless of active status)
  static async exists(id) {
    try {
      const rows = await query(
        "SELECT COUNT(*) as count FROM departments WHERE id = ?",
        [id]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error(`Error in exists ${id}:`, error);
      throw error;
    }
  }

  // Search departments (includes inactive departments)
  static async search(searchTerm) {
    try {
      const rows = await query(
        `
        SELECT 
          d.*, 
          u.full_name as manager_name,
          GROUP_CONCAT(DISTINCT r.name) as role_names
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.id
        LEFT JOIN department_roles dr ON d.id = dr.department_id AND dr.is_active = 1
        LEFT JOIN roles r ON dr.role_id = r.id AND r.is_active = 1
        WHERE (d.name LIKE ? OR d.code LIKE ? OR d.description LIKE ?)
        GROUP BY d.id
        ORDER BY d.name ASC
        `,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows.map((row) => this.normalizeRow(row));
    } catch (error) {
      console.error(`Error in search ${searchTerm}:`, error);
      throw error;
    }
  }

  // Get all active managers
  static async getActiveManagers() {
    try {
      const rows = await query(`
        SELECT id, full_name, email, role
        FROM users 
        WHERE is_active = TRUE 
        AND (role = 'MANAGER' OR role = 'ADMIN')
        ORDER BY full_name ASC
      `);
      return rows;
    } catch (error) {
      console.error("Error in getActiveManagers:", error);
      throw error;
    }
  }

  // Get department statistics
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_departments,
          SUM(is_active = 1) as active_departments,
          SUM(is_active = 0) as inactive_departments,
          COUNT(DISTINCT manager_id) as departments_with_manager
        FROM departments
      `);
      return stats[0];
    } catch (error) {
      console.error("Error in getStats:", error);
      throw error;
    }
  }

  // Helper method to normalize row data
  static normalizeRow(row) {
    if (!row) return row;

    row.is_active = Boolean(row.is_active);
    
    // Parse role_ids and role_names
    if (row.role_ids) {
      row.role_ids = row.role_ids ? row.role_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    }
    if (row.role_names) {
      row.role_names = row.role_names ? row.role_names.split(',') : [];
    }

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