// // models/userModel.js
// const { query } = require("../config/db");
// const crypto = require("crypto");

// const genId = () =>
//   `user_${crypto.randomBytes(6).toString("hex")}_${Date.now().toString(36)}`;

// const normalizePermissions = (row) => {
//   if (!row) return row;
//   try {
//     if (typeof row.permissions === "string" && row.permissions.trim()) {
//       row.permissions = JSON.parse(row.permissions);
//     } else if (!row.permissions) {
//       row.permissions = {};
//     }
//   } catch (e) {
//     row.permissions = {};
//   }
//   row.is_active = !!row.is_active;
//   return row;
// };

// // ✅ सभी users fetch करें
// // In findAll function:
// async function findAll() {
//   try {
//     const rows = await query(
//       `SELECT 
//         u.id, u.email, u.full_name, u.phone, u.role, 
//         u.department, d.id as department_id,  -- 👈 Add department_id
//         u.is_active, u.permissions, u.profile_picture, 
//         u.created_at, u.updated_at
//        FROM users u
//        LEFT JOIN departments d ON u.department = d.name AND d.is_active = TRUE
//        ORDER BY COALESCE(u.full_name, '') ASC`,
//     );
//     return rows.map(normalizePermissions);
//   } catch (error) {
//     console.error("Error in findAll:", error);
//     throw error;
//   }
// }

// async function findAllByRole(role) {
//   try {
//     const rows = await query(
//       `SELECT id, email, full_name, phone, role, department, is_active, permissions, created_at, updated_at
//        FROM users where role=?
//        ORDER BY COALESCE(full_name, '') ASC`,
//       [role],
//     );
//     return rows.map(normalizePermissions);
//   } catch (error) {
//     console.error("Error in findAllByRole:", error);
//     throw error;
//   }
// }

// // ✅ ID से user find करें
// async function findById(id) {
//   try {
//     const rows = await query(
//       `SELECT id, email, full_name, phone, role, department, is_active, 
//               permissions, profile_picture, created_at, updated_at
//        FROM users WHERE id = ? LIMIT 1`,
//       [id],
//     );
//     return normalizePermissions(rows[0] || null);
//   } catch (error) {
//     console.error("Error in findById:", error);
//     throw error;
//   }
// }

// // Update findByEmailWithPassword function
// async function findByEmailWithPassword(email) {
//   try {
//     const rows = await query(
//       `SELECT id, email, full_name, phone, role, department, is_active, 
//               permissions, profile_picture, password, created_at, updated_at
//        FROM users WHERE email = ? LIMIT 1`,
//       [email],
//     );
//     const row = rows[0] || null;
//     if (row) {
//       try {
//         if (typeof row.permissions === "string" && row.permissions.trim()) {
//           row.permissions = JSON.parse(row.permissions);
//         } else if (!row.permissions) {
//           row.permissions = {};
//         }
//       } catch {
//         row.permissions = {};
//       }
//       row.is_active = !!row.is_active;
//     }
//     return row;
//   } catch (error) {
//     console.error("Error in findByEmailWithPassword:", error);
//     throw error;
//   }
// }

// // ✅ नया user create करें
// // Update create function
// async function create({
//   email,
//   full_name,
//   phone,
//   role = "USER",
//   department,
//   password,
//   profile_picture = null,
//   is_active = true,
//   permissions = {},
// }) {
//   try {
//     const id = genId();

//     // Ensure all values are not undefined
//     const safeFullName = full_name || null;
//     const safePhone = phone || null;
//     const safeDepartment = department || null;
//     const safeProfilePicture = profile_picture || null;
//     const safePermissions = permissions
//       ? JSON.stringify(permissions)
//       : JSON.stringify({});
//     const safeIsActive = is_active ? 1 : 0;
//     const safeRole = role || "USER";

//     await query(
//       `INSERT INTO users (id, email, full_name, phone, role, department, 
//         is_active, password, permissions, profile_picture, created_at, updated_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//       [
//         id,
//         email,
//         safeFullName,
//         safePhone,
//         safeRole,
//         safeDepartment,
//         safeIsActive,
//         password,
//         safePermissions,
//         safeProfilePicture,
//       ],
//     );

//     return await findById(id);
//   } catch (error) {
//     console.error("Error in create:", error);
//     throw error;
//   }
// }

// // ✅ User update करें
// // Update update function
// async function update(
//   id,
//   { full_name, phone, role, department, password, profile_picture, is_active, permissions },
// ) {
//   try {
//     const fields = [];
//     const params = [];

//     // Prepare fields and params
//     if (full_name !== undefined) {
//       fields.push("full_name = ?");
//       params.push(full_name || null);
//     }
//     if (phone !== undefined) {
//       fields.push("phone = ?");
//       params.push(phone || null);
//     }
//     if (role !== undefined) {
//       fields.push("role = ?");
//       params.push(role || "USER");
//     }
//     if (department !== undefined) {
//       fields.push("department = ?");
//       params.push(department || null);
//     }
//     if (is_active !== undefined) {
//       fields.push("is_active = ?");
//       params.push(is_active ? 1 : 0);
//     }
//     if (password !== undefined) {
//       fields.push("password = ?");
//       params.push(password);
//     }
//     if (profile_picture !== undefined) {
//       fields.push("profile_picture = ?");
//       params.push(profile_picture || null);
//     }
//     if (permissions !== undefined) {
//       fields.push("permissions = ?");
//       params.push(JSON.stringify(permissions || {}));
//     }

//     // Always update updated_at
//     fields.push("updated_at = NOW()");

//     if (fields.length === 0) return findById(id);

//     // Add id to params
//     params.push(id);

//     const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
//     console.log("Update SQL:", sql, "Params:", params);

//     await query(sql, params);
//     return await findById(id);
//   } catch (error) {
//     console.error("Error in update:", error);
//     throw error;
//   }
// }

// // ✅ User delete करें
// async function remove(id) {
//   try {
//     await query(`DELETE FROM users WHERE id = ?`, [id]);
//     return true;
//   } catch (error) {
//     console.error("Error in remove:", error);
//     throw error;
//   }
// }

// // ✅ Active status toggle करें
// async function toggleActive(id) {
//   try {
//     await query(`UPDATE users SET is_active = NOT is_active WHERE id = ?`, [
//       id,
//     ]);
//     return await findById(id);
//   } catch (error) {
//     console.error("Error in toggleActive:", error);
//     throw error;
//   }
// }

// // ✅ User permissions update करें
// async function updateUserPermissions(userId, permissions) {
//   try {
//     await query(
//       "UPDATE users SET permissions = ?, updated_at = NOW() WHERE id = ?",
//       [JSON.stringify(permissions || {}), userId],
//     );
//     return await findById(userId);
//   } catch (error) {
//     console.error("Error in updateUserPermissions:", error);
//     throw error;
//   }
// }

// module.exports = {
//   findAll,
//   findAllByRole,
//   findById,
//   findByEmailWithPassword,
//   create,
//   update,
//   remove,
//   toggleActive,
//   updateUserPermissions,
// };




/*----------------------31-1-26-------------------*/
const { promisePool } = require("../config/db");
const { v4: uuidv4 } = require('uuid');

/**
 * Check if a column exists in the table
 */
const checkColumnExists = async (tableName, columnName) => {
  try {
    const [result] = await promisePool.query(`
      SELECT COUNT(*) as exists_flag 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
    `, [tableName, columnName]);
    
    return result[0]?.exists_flag > 0;
  } catch (error) {
    console.error(`Error checking column ${columnName}:`, error);
    return false;
  }
};

/**
 * Get all users
 */
const findAll = async () => {
  try {
    const [rows] = await promisePool.query(`
      SELECT 
        id,
        email,
        full_name,
        phone,
        role,
        department,
        profile_picture,
        is_active,
        permissions,
        created_at,
        updated_at
      FROM users 
      ORDER BY full_name, email
    `);
    
    // Parse permissions if they're JSON strings
    const users = rows.map(user => {
      if (user.permissions && typeof user.permissions === 'string') {
        try {
          user.permissions = JSON.parse(user.permissions);
        } catch {
          user.permissions = {};
        }
      }
      return user;
    });
    
    return users;
  } catch (error) {
    console.error("Find all users error:", error);
    throw error;
  }
};

/**
 * Find users by role
 */
const findAllByRole = async (role) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM users WHERE role = ? ORDER BY full_name",
      [role.toUpperCase()]
    );
    return rows;
  } catch (error) {
    console.error("Find by role error:", error);
    throw error;
  }
};

/**
 * Find user by ID
 */
const findById = async (id) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const user = rows[0];
    
    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === 'string') {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch {
        user.permissions = {};
      }
    }
    
    return user;
  } catch (error) {
    console.error("Find by ID error:", error);
    throw error;
  }
};

/**
 * Find user by email (without password)
 */
const findByEmail = async (email) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    
    if (rows.length === 0) return null;
    
    const user = rows[0];
    
    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === 'string') {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch {
        user.permissions = {};
      }
    }
    
    return user;
  } catch (error) {
    console.error("Find by email error:", error);
    throw error;
  }
};

/**
 * Find user by email with password (for login)
 */
const findByEmailWithPassword = async (email) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    
    if (rows.length === 0) return null;
    
    const user = rows[0];
    
    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === 'string') {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch {
        user.permissions = {};
      }
    }
    
    return user;
  } catch (error) {
    console.error("Find by email with password error:", error);
    throw error;
  }
};

/**
 * Create new user - FIXED: Generate UUID for id
 */
const create = async (data) => {
  try {
    // First check if department_id column exists
    const hasDepartmentIdColumn = await checkColumnExists('users', 'department_id');
    
    const columns = [];
    const values = [];
    const placeholders = [];

    // Generate a unique ID for the user
    const userId = `user_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
    
    // Map of column names to values
    const columnMap = {
      id: userId, // Add generated ID
      email: data.email,
      full_name: data.full_name || null,
      phone: data.phone || null,
      role: data.role || 'USER',
      department: data.department || null,
      profile_picture: data.profile_picture || null,
      password: data.password,
      is_active: data.is_active !== false ? 1 : 0,
      permissions: data.permissions ? JSON.stringify(data.permissions) : JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add department_id only if column exists
    if (hasDepartmentIdColumn && data.department_id !== undefined) {
      columnMap.department_id = data.department_id || null;
    }

    // Build dynamic query
    Object.entries(columnMap).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        columns.push(key);
        values.push(value);
        placeholders.push('?');
      }
    });

    if (columns.length === 0) {
      throw new Error("No data provided for user creation");
    }

    const sql = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    
    console.log("Create user SQL:", sql);
    console.log("Create user values:", values.map((v, i) => 
      columns[i] === 'password' ? '***PASSWORD***' : 
      columns[i] === 'id' ? `ID: ${v.substring(0, 10)}...` : v
    ));

    const [result] = await promisePool.query(sql, values);
    
    console.log("User created with result:", result);
    
    // Get the created user
    const createdUser = await findById(userId);
    
    if (!createdUser) {
      console.warn("Created user not found after insertion. Trying to fetch by email...");
      return await findByEmail(data.email);
    }
    
    return createdUser;
  } catch (error) {
    console.error("Create user error:", error);
    console.error("Error details:", {
      message: error.message,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
};

/**
 * Update user
 */
const update = async (id, data) => {
  try {
    // First check which columns exist
    const hasDepartmentIdColumn = await checkColumnExists('users', 'department_id');
    
    const fields = [];
    const values = [];

    // Only include fields that exist in the table
    const allowedFields = [
      "email",
      "full_name",
      "phone",
      "role",
      "department",
      "profile_picture",
      "is_active",
      "permissions",
      "password"
    ];

    allowedFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        fields.push(`${key} = ?`);
        
        // Handle special cases
        if (key === 'permissions') {
          values.push(data[key] ? JSON.stringify(data[key]) : JSON.stringify({}));
        } else if (key === 'is_active') {
          values.push(data[key] ? 1 : 0);
        } else {
          values.push(data[key]);
        }
      }
    });

    // Add department_id only if column exists and data is provided
    if (hasDepartmentIdColumn && Object.prototype.hasOwnProperty.call(data, 'department_id')) {
      fields.push("department_id = ?");
      values.push(data.department_id || null);
    }

    // Add updated_at timestamp
    fields.push("updated_at = NOW()");

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    console.log("Update user SQL:", sql);
    console.log("Update user values:", values.map((v, i) => 
      allowedFields.includes(Object.keys(data)[i]) && Object.keys(data)[i] === 'password' ? '***PASSWORD***' : v
    ));

    const [result] = await promisePool.query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    // Return updated user
    return await findById(id);
  } catch (error) {
    console.error("Update user error:", error);
    throw error;
  }
};

/**
 * Delete user
 */
const remove = async (id) => {
  try {
    const [result] = await promisePool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Delete user error:", error);
    throw error;
  }
};

/**
 * Toggle active status
 */
const toggleActive = async (id) => {
  try {
    const [result] = await promisePool.query(
      "UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?",
      [id]
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return await findById(id);
  } catch (error) {
    console.error("Toggle active error:", error);
    throw error;
  }
};

/**
 * Update user permissions
 */
const updateUserPermissions = async (userId, permissions) => {
  try {
    const [result] = await promisePool.query(
      "UPDATE users SET permissions = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(permissions), userId]
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return await findById(userId);
  } catch (error) {
    console.error("Update permissions error:", error);
    throw error;
  }
};

module.exports = {
  findAll,
  findAllByRole,
  findById,
  findByEmail,
  findByEmailWithPassword,
  create,
  update,
  remove,
  toggleActive,
  updateUserPermissions,
  checkColumnExists
};