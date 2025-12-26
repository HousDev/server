// backend/models/items.model.js
const { promisePool } = require("../config/db");

const findAll = async () => {
  const [rows] = await promisePool.query(
    "SELECT * FROM items ORDER BY item_name"
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await promisePool.query("SELECT * FROM items WHERE id = ?", [
    id,
  ]);
  return rows[0] || null;
};

const findByCode = async (item_code) => {
  const [rows] = await promisePool.query(
    "SELECT * FROM items WHERE item_code = ?",
    [item_code]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const {
    item_code,
    item_name,
    category = "material",
    description = null,
    unit = "nos",
    hsn_code = null,
    gst_rate = 0,
    standard_rate = 0,
    is_active = 1,
    location,
  } = data;

  const [result] = await promisePool.query(
    `INSERT INTO items
      (item_code, item_name, category, description, unit, hsn_code, gst_rate, standard_rate, is_active,location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item_code,
      item_name,
      category,
      description,
      unit,
      hsn_code,
      gst_rate,
      standard_rate,
      is_active ? 1 : 0,
      location,
    ]
  );

  const inserted = await findById(result.insertId);
  return inserted;
};

const update = async (id, data) => {
  const fields = [];
  const vals = [];

  const allowed = [
    "item_code",
    "item_name",
    "category",
    "description",
    "unit",
    "hsn_code",
    "gst_rate",
    "standard_rate",
    "is_active",
    "location",
  ];
  allowed.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      fields.push(`${k} = ?`);
      if (k === "is_active") vals.push(data[k] ? 1 : 0);
      else vals.push(data[k]);
    }
  });

  if (fields.length === 0) return await findById(id);

  vals.push(id);
  const sql = `UPDATE items SET ${fields.join(", ")} WHERE id = ?`;
  await promisePool.query(sql, vals);

  return await findById(id);
};

const remove = async (id) => {
  const [result] = await promisePool.query("DELETE FROM items WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

const toggleActive = async (id) => {
  const item = await findById(id);
  if (!item) return null;
  const newStatus = item.is_active ? 0 : 1;
  await promisePool.query("UPDATE items SET is_active = ? WHERE id = ?", [
    newStatus,
    id,
  ]);
  return await findById(id);
};

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  remove,
  toggleActive,
};
