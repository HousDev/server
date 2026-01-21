// models/userModel.js
const { query } = require("../config/db");
const crypto = require("crypto");

const genId = () =>
  `user_${crypto.randomBytes(6).toString("hex")}_${Date.now().toString(36)}`;

const normalizePermissions = (row) => {
  if (!row) return row;
  try {
    if (typeof row.permissions === "string")
      row.permissions = JSON.parse(row.permissions);
  } catch (e) {
    row.permissions = {};
  }
  row.is_active = !!row.is_active;
  return row;
};

async function findAll() {
  const rows = await query(
    `SELECT id, email, full_name, phone, role, department, is_active, permissions, created_at, updated_at
     FROM users
     ORDER BY COALESCE(full_name, '') ASC`,
  );
  return rows.map(normalizePermissions);
}

async function findAllByRole(role) {
  const rows = await query(
    `SELECT id, email, full_name, phone, role, department, is_active, permissions, created_at, updated_at
     FROM users where role=?
     ORDER BY COALESCE(full_name, '') ASC`,
    [role],
  );
  return rows.map(normalizePermissions);
}

async function findById(id) {
  const rows = await query(
    `SELECT id, email, full_name, phone, role, department, is_active, permissions, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return normalizePermissions(rows[0] || null);
}

async function findByEmailWithPassword(email) {
  const rows = await query(
    `SELECT id, email, full_name, phone, role, department, is_active, permissions, password, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  const row = rows[0] || null;
  if (row) {
    try {
      if (typeof row.permissions === "string")
        row.permissions = JSON.parse(row.permissions);
    } catch {
      row.permissions = {};
    }
    row.is_active = !!row.is_active;
  }
  return row;
}

async function create({
  email,
  full_name,
  phone,
  role = "user",
  department,
  passwordHash,
  is_active = true,
  permissions = {},
}) {
  const id = genId();
  await query(
    `INSERT INTO users (id, email, full_name, phone, role, department, is_active, password, permissions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      email,
      full_name || null,
      phone || null,
      role,
      department || null,
      is_active ? 1 : 0,
      passwordHash,
      JSON.stringify(permissions || {}),
    ],
  );
  return findById(id);
}

async function update(
  id,
  { full_name, phone, role, department, passwordHash, is_active, permissions },
) {
  const fields = [];
  const params = [];

  if (full_name !== undefined) {
    fields.push("full_name = ?");
    params.push(full_name);
  }
  if (phone !== undefined) {
    fields.push("phone = ?");
    params.push(phone);
  }
  if (role !== undefined) {
    fields.push("role = ?");
    params.push(role);
  }
  if (department !== undefined) {
    fields.push("department = ?");
    params.push(department);
  }
  if (is_active !== undefined) {
    fields.push("is_active = ?");
    params.push(is_active ? 1 : 0);
  }
  if (passwordHash) {
    fields.push("password = ?");
    params.push(passwordHash);
  }
  if (permissions !== undefined) {
    fields.push("permissions = ?");
    params.push(JSON.stringify(permissions));
  }

  if (fields.length === 0) return findById(id);

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  params.push(id);
  await query(sql, params);
  return findById(id);
}

async function remove(id) {
  await query(`DELETE FROM users WHERE id = ?`, [id]);
  return true;
}

async function toggleActive(id) {
  await query(`UPDATE users SET is_active = NOT is_active WHERE id = ?`, [id]);
  return findById(id);
}

async function updateUserPermissions(userId, permissions) {
  await query("UPDATE users SET permissions = ? WHERE id = ?", [
    permissions,
    userId,
  ]);
  return findById(userId);
}

module.exports = {
  findAll,
  findAllByRole,
  findById,
  findByEmailWithPassword,
  create,
  update,
  remove,
  toggleActive,
  updateUserPermissions,
};
