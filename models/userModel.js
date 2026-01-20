// models/userModel.js
const { query } = require("../config/db");
const crypto = require("crypto");

const genId = () =>
  `user_${crypto.randomBytes(6).toString("hex")}_${Date.now().toString(36)}`;

const normalizePermissions = (row) => {
  if (!row) return row;
  try {
    if (typeof row.permissions === "string" && row.permissions.trim()) {
      row.permissions = JSON.parse(row.permissions);
    } else if (!row.permissions) {
      row.permissions = {};
    }
  } catch (e) {
    row.permissions = {};
  }
  row.is_active = !!row.is_active;
  return row;
};

// ✅ सभी users fetch करें
async function findAll() {
  try {
    const rows = await query(
      `SELECT id, email, full_name, phone, role, department, is_active, permissions, created_at, updated_at
       FROM users
       ORDER BY COALESCE(full_name, '') ASC`,
    );
    return rows.map(normalizePermissions);
  } catch (error) {
    console.error("Error in findAll:", error);
    throw error;
  }
}

// ✅ ID से user find करें
async function findById(id) {
  try {
    const rows = await query(
      `SELECT id, email, full_name, phone, role, department, is_active, permissions, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [id],
    );
    return normalizePermissions(rows[0] || null);
  } catch (error) {
    console.error("Error in findById:", error);
    throw error;
  }
}

// ✅ Email से user find करें (password के साथ)
async function findByEmailWithPassword(email) {
  try {
    const rows = await query(
      `SELECT id, email, full_name, phone, role, department, is_active, permissions, password, created_at, updated_at
       FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    const row = rows[0] || null;
    if (row) {
      try {
        if (typeof row.permissions === "string" && row.permissions.trim()) {
          row.permissions = JSON.parse(row.permissions);
        } else if (!row.permissions) {
          row.permissions = {};
        }
      } catch {
        row.permissions = {};
      }
      row.is_active = !!row.is_active;
    }
    return row;
  } catch (error) {
    console.error("Error in findByEmailWithPassword:", error);
    throw error;
  }
}

// ✅ नया user create करें (FIXED)
async function create({
  email,
  full_name,
  phone,
  role = "USER",
  department,
  password,
  is_active = true,
  permissions = {},
}) {
  try {
    const id = genId();

    // Debug logging
    console.log("Creating user with data:", {
      id,
      email,
      full_name,
      phone,
      role,
      department,
      is_active,
      permissions,
    });

    // Ensure all values are not undefined
    const safeFullName = full_name || null;
    const safePhone = phone || null;
    const safeDepartment = department || null;
    const safePermissions = permissions
      ? JSON.stringify(permissions)
      : JSON.stringify({});
    const safeIsActive = is_active ? 1 : 0;
    const safeRole = role || "USER";

    await query(
      `INSERT INTO users (id, email, full_name, phone, role, department, is_active, password, permissions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        email,
        safeFullName,
        safePhone,
        safeRole,
        safeDepartment,
        safeIsActive,
        password,
        safePermissions,
      ],
    );

    return await findById(id);
  } catch (error) {
    console.error("Error in create:", error);
    throw error;
  }
}

// ✅ User update करें (FIXED)
async function update(
  id,
  { full_name, phone, role, department, password, is_active, permissions },
) {
  try {
    const fields = [];
    const params = [];

    // Prepare fields and params
    if (full_name !== undefined) {
      fields.push("full_name = ?");
      params.push(full_name || null);
    }
    if (phone !== undefined) {
      fields.push("phone = ?");
      params.push(phone || null);
    }
    if (role !== undefined) {
      fields.push("role = ?");
      params.push(role || "USER");
    }
    if (department !== undefined) {
      fields.push("department = ?");
      params.push(department || null);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }
    if (password !== undefined) {
      fields.push("password = ?");
      params.push(password);
    }
    if (permissions !== undefined) {
      fields.push("permissions = ?");
      params.push(JSON.stringify(permissions || {}));
    }

    // Always update updated_at
    fields.push("updated_at = NOW()");

    if (fields.length === 0) return findById(id);

    // Add id to params
    params.push(id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    console.log("Update SQL:", sql, "Params:", params);

    await query(sql, params);
    return await findById(id);
  } catch (error) {
    console.error("Error in update:", error);
    throw error;
  }
}

// ✅ User delete करें
async function remove(id) {
  try {
    await query(`DELETE FROM users WHERE id = ?`, [id]);
    return true;
  } catch (error) {
    console.error("Error in remove:", error);
    throw error;
  }
}

// ✅ Active status toggle करें
async function toggleActive(id) {
  try {
    await query(`UPDATE users SET is_active = NOT is_active WHERE id = ?`, [
      id,
    ]);
    return await findById(id);
  } catch (error) {
    console.error("Error in toggleActive:", error);
    throw error;
  }
}

// ✅ User permissions update करें
async function updateUserPermissions(userId, permissions) {
  try {
    await query(
      "UPDATE users SET permissions = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(permissions || {}), userId],
    );
    return await findById(userId);
  } catch (error) {
    console.error("Error in updateUserPermissions:", error);
    throw error;
  }
}

module.exports = {
  findAll,
  findById,
  findByEmailWithPassword,
  create,
  update,
  remove,
  toggleActive,
  updateUserPermissions,
};
