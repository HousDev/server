const { query } = require("../config/db");

async function findById(id) {
  const rows = await query(`SELECT * FROM roles WHERE id = ?`, [id]);
  return rows;
}

async function findAll() {
  return await query("SELECT * FROM roles ORDER BY name ASC");
}

async function findByName(name) {
  const rows = await query(
    "SELECT id, name FROM roles WHERE name = ? LIMIT 1",
    [name]
  );

  return rows[0] || null;
}

async function create({ name, permissions }) {
  const createdRole = await query(
    `INSERT INTO roles (name, permissions)
     VALUES (?, ?)`,
    [name, JSON.stringify(permissions || {})]
  );
  return await findById(createdRole.insertId);
}

async function update(id, permissions) {
  const sql = `UPDATE roles SET permissions = ? WHERE id = ?`;

  await query(sql, [JSON.stringify(permissions), id]);
  return await findById(id);
}

module.exports = {
  create,
  update,
  findAll,
  findByName,
  findById,
};
