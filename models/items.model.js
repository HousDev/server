// backend/models/items.model.js
const { promisePool, pool } = require("../config/db");

const findAll = async () => {
  const [rows] = await promisePool.query(
    "SELECT * FROM items ORDER BY item_code",
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
    [item_code],
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
    igst_rate = 0,
    cgst_rate = 0,
    sgst_rate = 0,
    standard_rate = 0,
    is_active = 1,
    location,
  } = data;

  const [result] = await promisePool.query(
    `INSERT INTO items
      (item_code, item_name, category, description, unit, hsn_code, igst_rate, cgst_rate, sgst_rate, standard_rate, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item_code,
      item_name,
      category,
      description,
      unit,
      hsn_code,
      igst_rate,
      cgst_rate,
      sgst_rate,
      standard_rate,
      is_active ? 1 : 0,
    ],
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
    "igst_rate",
    "cgst_rate",
    "sgst_rate",
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 2️⃣ Delete item
    const [result] = await connection.query("DELETE FROM items WHERE id = ?", [
      id,
    ]);

    // 1️⃣ Delete inventory first
    await connection.query("DELETE FROM inventory WHERE item_id = ?", [id]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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

const getItemCategories = async () => {
  try {
    const [rows] = await promisePool.query(
      "SELECT DISTINCT item_category FROM items WHERE item_category IS NOT NULL AND item_category != '' ORDER BY item_category",
    );
    return rows.map((row) => row.item_category).filter(Boolean);
  } catch (error) {
    console.error("Error fetching item categories:", error);
    return [];
  }
};

// Get all unique item sub-categories
const getItemSubCategories = async () => {
  try {
    const [rows] = await promisePool.query(
      "SELECT DISTINCT item_sub_category FROM items WHERE item_sub_category IS NOT NULL AND item_sub_category != '' ORDER BY item_sub_category",
    );
    return rows.map((row) => row.item_sub_category).filter(Boolean);
  } catch (error) {
    console.error("Error fetching item sub-categories:", error);
    return [];
  }
};

// Get items by category
const findByCategory = async (category) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM items WHERE item_category = ? ORDER BY item_name",
      [category],
    );
    return rows;
  } catch (error) {
    console.error("Error fetching items by category:", error);
    return [];
  }
};
module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  remove,
  toggleActive,
  getItemCategories, // ✅ ADD THIS
  getItemSubCategories, // ✅ ADD THIS
  findByCategory, //
};
