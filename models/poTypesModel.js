const { pool } = require("../config/db");

async function getAll() {
  const [rows] = await pool.query("SELECT * FROM po_types ORDER BY id DESC");
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query("SELECT * FROM po_types WHERE id = ?", [id]);
  return rows[0];
}

async function create(data) {
  const { name, description, is_active } = data;

  const [result] = await pool.query(
    `INSERT INTO po_types (name, description, is_active)
     VALUES (?, ?, ?)`,
    [name, description || null, is_active ? 1 : 0]
  );
  return { id: result.insertId, ...data };
}

async function update(id, data) {
  const { name, description, is_active } = data;

  await pool.query(
    `UPDATE po_types SET 
        name = ?, 
        description = ?, 
        is_active = ?
     WHERE id = ?`,
    [name, description || null, is_active ? 1 : 0, id]
  );

  return { id, ...data };
}

async function remove(id) {
  await pool.query("DELETE FROM po_types WHERE id = ?", [id]);
  return { message: "Deleted successfully" };
}

module.exports = { getAll, getById, create, update, remove };
