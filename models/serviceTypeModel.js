// models/serviceTypeModel.js
const { pool } = require("../config/db");

async function findAll({ onlyActive = false } = {}) {
  const where = onlyActive ? "WHERE is_active = 1" : "";
  const sql = `SELECT * FROM service_types ${where} ORDER BY name ASC LIMIT 1000`;
  const [rows] = await pool.query(sql);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    "SELECT * FROM service_types WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function create({
  name,
  description = null,
  is_active = 1,
  created_by = null,
}) {
  const [res] = await pool.query(
    "INSERT INTO service_types (name, description, is_active, created_by) VALUES (?, ?, ?, ?)",
    [name, description, is_active ? 1 : 0, created_by]
  );
  return { id: res.insertId };
}

async function update(id, { name, description = null, is_active = true }) {
  const [res] = await pool.query(
    "UPDATE service_types SET name = ?, description = ?, is_active = ? WHERE id = ?",
    [name, description, is_active ? 1 : 0, id]
  );
  return res.affectedRows;
}

async function remove(id) {
  const [res] = await pool.query(
    "UPDATE service_types SET is_active = 0 WHERE id = ?",
    [id]
  );
  return res.affectedRows;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
