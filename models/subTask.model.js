// backend/models/subTask.model.js
const { promisePool } = require("../config/db");

/**
 * Get all sub-tasks (optionally by main task)
 */
const findAll = async (filters = {}) => {
  let sql = "SELECT * FROM area_sub_tasks WHERE 1=1";
  const values = [];

  if (filters.area_task_id) {
    sql += " AND area_task_id = ?";
    values.push(filters.area_task_id);
  }

  sql += " ORDER BY created_at ASC";

  const [rows] = await promisePool.query(sql, values);
  return rows;
};

/**
 * Get sub-task by ID
 */
const findById = async (id) => {
  const [rows] = await promisePool.query(
    "SELECT * FROM area_sub_tasks WHERE id = ?",
    [id],
  );
  return rows[0] || null;
};

/**
 * Create sub-task
 */
const create = async (data) => {
  const {
    area_task_id,
    name,
    unit,
    total_work,
    progress = 0,
    status = "pending",
  } = data;

  const sql = `
    INSERT INTO area_sub_tasks
      (area_task_id, name, unit, total_work, progress, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await promisePool.query(sql, [
    area_task_id,
    name,
    unit,
    total_work,
    progress,
    status,
  ]);

  return await findById(result.insertId);
};

/**
 * Update sub-task
 */
const update = async (id, data) => {
  // Use destructuring and provide default fallbacks
  const { name, unit, total_work, progress, status } = data;
  console.log(status);

  const sql = `
    UPDATE area_sub_tasks
    SET name = ?, unit = ?, total_work = ?, progress = ?, status = ?
    WHERE id = ?
  `;

  await promisePool.query(sql, [name, unit, total_work, progress, status, id]);
  return await findById(id);
};

/**
 * Delete sub-task
 */
const remove = async (id) => {
  const [result] = await promisePool.query(
    "DELETE FROM area_sub_tasks WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

/**
 * Update progress & status only
 */
const updateProgress = async (id, progress, status) => {
  const sql = `
    UPDATE area_sub_tasks
    SET progress = ?, status = ?
    WHERE id = ?
  `;
  await promisePool.query(sql, [progress, status, id]);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  updateProgress,
};
