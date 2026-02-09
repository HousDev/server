const { promisePool, pool } = require("../config/db");

/* ---------------- basic queries ---------------- */

const findAll = async () => {
  const [rows] = await promisePool.query(
    "SELECT * FROM services ORDER BY service_code",
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await promisePool.query(
    "SELECT * FROM services WHERE id = ?",
    [id],
  );
  return rows[0] || null;
};

const findByCode = async (service_code) => {
  const [rows] = await promisePool.query(
    "SELECT * FROM services WHERE service_code = ?",
    [service_code],
  );
  return rows[0] || null;
};

/* ---------------- create ---------------- */

const create = async (data) => {
  const {
    service_code,
    service_name,
    category = "service",
    description = null,
    unit = "nos",
    igst_rate = 0,
    cgst_rate = 0,
    sgst_rate = 0,
    standard_rate = 0,
    is_active = 1,
    service_category = null,
    service_sub_category = null,
  } = data;

  const [result] = await promisePool.query(
    `INSERT INTO services
      (
        service_code,
        service_name,
        category,
        description,
        unit,
        igst_rate,
        cgst_rate,
        sgst_rate,
        standard_rate,
        is_active,
        service_category,
        service_sub_category
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      service_code,
      service_name,
      category,
      description,
      unit,
      igst_rate,
      cgst_rate,
      sgst_rate,
      standard_rate,
      is_active ? 1 : 0,
      service_category,
      service_sub_category,
    ],
  );

  return await findById(result.insertId);
};

/* ---------------- update ---------------- */

const update = async (id, data) => {
  const fields = [];
  const vals = [];

  const allowed = [
    "service_code",
    "service_name",
    "category",
    "description",
    "unit",
    "igst_rate",
    "cgst_rate",
    "sgst_rate",
    "standard_rate",
    "is_active",
    "service_category",
    "service_sub_category",
  ];

  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = ?`);
      if (key === "is_active") vals.push(data[key] ? 1 : 0);
      else vals.push(data[key]);
    }
  });

  if (fields.length === 0) return await findById(id);

  vals.push(id);
  const sql = `UPDATE services SET ${fields.join(", ")} WHERE id = ?`;
  await promisePool.query(sql, vals);

  return await findById(id);
};

/* ---------------- delete ---------------- */

const remove = async (id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "DELETE FROM services WHERE id = ?",
      [id],
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/* ---------------- helpers ---------------- */

const toggleActive = async (id) => {
  const service = await findById(id);
  if (!service) return null;

  const newStatus = service.is_active ? 0 : 1;
  await promisePool.query("UPDATE services SET is_active = ? WHERE id = ?", [
    newStatus,
    id,
  ]);

  return await findById(id);
};

const getServiceCategories = async () => {
  try {
    const [rows] = await promisePool.query(
      `SELECT DISTINCT service_category
       FROM services
       WHERE service_category IS NOT NULL
         AND service_category != ''
       ORDER BY service_category`,
    );

    return rows.map((r) => r.service_category).filter(Boolean);
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return [];
  }
};

const getServiceSubCategories = async () => {
  try {
    const [rows] = await promisePool.query(
      `SELECT DISTINCT service_sub_category
       FROM services
       WHERE service_sub_category IS NOT NULL
         AND service_sub_category != ''
       ORDER BY service_sub_category`,
    );

    return rows.map((r) => r.service_sub_category).filter(Boolean);
  } catch (error) {
    console.error("Error fetching service sub-categories:", error);
    return [];
  }
};

const findByCategory = async (category) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM services WHERE service_category = ? ORDER BY service_name",
      [category],
    );
    return rows;
  } catch (error) {
    console.error("Error fetching services by category:", error);
    return [];
  }
};

/* ---------------- exports ---------------- */

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  remove,
  toggleActive,
  getServiceCategories,
  getServiceSubCategories,
  findByCategory,
};
