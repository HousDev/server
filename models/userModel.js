/*----------------------31-1-26-------------------*/
const { promisePool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/**
 * Check if a column exists in the table
 */
const checkColumnExists = async (tableName, columnName) => {
  try {
    const [result] = await promisePool.query(
      `
      SELECT COUNT(*) as exists_flag 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
    `,
      [tableName, columnName],
    );

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
    const users = rows.map((user) => {
      if (user.permissions && typeof user.permissions === "string") {
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
      [role.toLowerCase()],
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
    const [rows] = await promisePool.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) return null;

    const user = rows[0];

    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === "string") {
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
      [email],
    );

    if (rows.length === 0) return null;

    const user = rows[0];

    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === "string") {
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
      [email],
    );

    if (rows.length === 0) return null;

    const user = rows[0];

    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === "string") {
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

const findByPhoneWithPassword = async (phone) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone],
    );

    if (rows.length === 0) return null;

    const user = rows[0];

    // Parse permissions if they're JSON strings
    if (user.permissions && typeof user.permissions === "string") {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch {
        user.permissions = {};
      }
    }

    return user;
  } catch (error) {
    console.error("Find by phone with password error:", error);
    throw error;
  }
};

/**
 * Create new user - FIXED: Generate UUID for id
 */
const create = async (data) => {
  try {
    // First check if department_id column exists
    const hasDepartmentIdColumn = await checkColumnExists(
      "users",
      "department_id",
    );

    const columns = [];
    const values = [];
    const placeholders = [];

    // Generate a unique ID for the user
    const userId = `user_${uuidv4().replace(/-/g, "").substring(0, 20)}`;

    // Map of column names to values
    const columnMap = {
      id: userId, // Add generated ID
      email: data.email,
      full_name: data.full_name || null,
      phone: data.phone || null,
      role: data.role || "USER",
      department: data.department || null,
      profile_picture: data.profile_picture || null,
      password: data.password,
      is_active: data.is_active !== false ? 1 : 0,
      permissions: data.permissions
        ? JSON.stringify(data.permissions)
        : JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date(),
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
        placeholders.push("?");
      }
    });

    if (columns.length === 0) {
      throw new Error("No data provided for user creation");
    }

    const sql = `INSERT INTO users (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;

    console.log("Create user SQL:", sql);
    console.log(
      "Create user values:",
      values.map((v, i) =>
        columns[i] === "password"
          ? "***PASSWORD***"
          : columns[i] === "id"
            ? `ID: ${v.substring(0, 10)}...`
            : v,
      ),
    );

    const [result] = await promisePool.query(sql, values);

    console.log("User created with result:", result);

    // Get the created user
    const createdUser = await findById(userId);

    if (!createdUser) {
      console.warn(
        "Created user not found after insertion. Trying to fetch by email...",
      );
      return await findByEmail(data.email);
    }

    return createdUser;
  } catch (error) {
    console.error("Create user error:", error);
    console.error("Error details:", {
      message: error.message,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
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
    const hasDepartmentIdColumn = await checkColumnExists(
      "users",
      "department_id",
    );
    console.log(data);
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
      "password",
    ];

    allowedFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        fields.push(`${key} = ?`);

        // Handle special cases
        if (key === "permissions") {
          values.push(
            data[key] ? JSON.stringify(data[key]) : JSON.stringify({}),
          );
        } else if (key === "is_active") {
          values.push(data[key] ? 1 : 0);
        } else {
          values.push(data[key]);
        }
      }
    });

    // Add department_id only if column exists and data is provided
    if (
      hasDepartmentIdColumn &&
      Object.prototype.hasOwnProperty.call(data, "department_id")
    ) {
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
    console.log(
      "Update user values:",
      values.map((v, i) =>
        allowedFields.includes(Object.keys(data)[i]) &&
        Object.keys(data)[i] === "password"
          ? "***PASSWORD***"
          : v,
      ),
    );

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
    const [result] = await promisePool.query("DELETE FROM users WHERE id = ?", [
      id,
    ]);
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
      [id],
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
      [JSON.stringify(permissions), userId],
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
const checkPhoneExists = async (phone, excludeUserId = null) => {
  try {
    if (!phone || phone.trim() === "") {
      return { exists: false, table: null };
    }

    // Check in users table (excluding current user if provided)
    let userQuery = "SELECT id FROM users WHERE phone = ?";
    let userParams = [phone];

    if (excludeUserId) {
      userQuery += " AND id != ?";
      userParams.push(excludeUserId);
    }

    const [userRows] = await promisePool.query(userQuery, userParams);

    if (userRows && userRows.length > 0) {
      return { exists: true, table: "users" };
    }

    // Check in employees table
    const [employeeRows] = await promisePool.query(
      "SELECT id FROM hrms_employees WHERE phone = ?",
      [phone],
    );

    if (employeeRows && employeeRows.length > 0) {
      return { exists: true, table: "employees" };
    }

    return { exists: false, table: null };
  } catch (error) {
    console.error("Check phone exists error:", error);
    throw error;
  }
};

module.exports = {
  findAll,
  findAllByRole,
  findById,
  findByEmail,
  findByEmailWithPassword,
  findByPhoneWithPassword, // ← ADD THIS LINE

  create,
  update,
  remove,
  toggleActive,
  updateUserPermissions,
  checkColumnExists,
  checkPhoneExists,
};
