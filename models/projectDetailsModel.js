const { query } = require("../config/db");

/**
 * Find project detail by ID
 */
async function findById(id) {
  const rows = await query(`SELECT * FROM project_details WHERE id = ?`, [id]);
  return rows[0] || null;
}

/**
 * Get all project details
 */
async function findAll() {
  return await query(`SELECT * FROM project_details ORDER BY name ASC`);
}

/**
 * Find project detail by name (unique)
 */
async function findByName(name) {
  const rows = await query(
    `SELECT id, name, category FROM project_details WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows[0] || null;
}

/**
 * Create new project detail
 */
async function create({ name, category }) {
  const result = await query(
    `INSERT INTO project_details (name, category)
     VALUES (?, ?)`,
    [name, category]
  );

  return await findById(result.insertId);
}

/**
 * Update project detail
 */
async function update(id, { name, category }) {
  await query(
    `UPDATE project_details
     SET name = ?, category = ?
     WHERE id = ?`,
    [name, category, id]
  );

  return await findById(id);
}

/**
 * Delete project detail (optional)
 */
async function remove(id) {
  return await query(`DELETE FROM project_details WHERE id = ?`, [id]);
}

module.exports = {
  create,
  update,
  remove,
  findAll,
  findByName,
  findById,
};
