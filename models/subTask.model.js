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

const findAllTaskByProjectId = async (projectId) => {
  const sql = "SELECT * FROM area_sub_tasks WHERE project_id=?";

  const [rows] = await promisePool.query(sql, [projectId]);
  return rows;
};

const findAllByAreaId = async (filters = {}) => {
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
    project_id,
    building_id,
    floor_id,
    flat_id,
    common_area_id,
    area_id,
    engineer_id,
    name,
    unit,
    total_work,
    start_date,
    end_date,
  } = data;

  const sql = `
    INSERT INTO area_sub_tasks
      (project_id, building_id, floor_id, flat_id, common_area_id, area_id, engineer_id, name, unit, total_work,  start_date, end_date, progress, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await promisePool.query(sql, [
    project_id,
    building_id,
    floor_id,
    flat_id || null,
    common_area_id || null,
    area_id || null,
    engineer_id,
    name,
    unit,
    total_work,
    start_date,
    end_date,
    0.0,
    "pending",
  ]);

  return await findById(result.insertId);
};

/**
 * Update sub-task
 */
const update = async (id, data) => {
  // Use destructuring and provide default fallbacks
  const { total_work, unit, engineer_id, start_date, end_date } = data;

  const sql = `
    UPDATE area_sub_tasks
    SET total_work = ?, unit = ?,engineer_id = ?,  start_date = ?, end_date = ?
    WHERE id = ?
  `;

  await promisePool.query(sql, [
    total_work,
    unit,
    engineer_id,
    start_date,
    end_date,
    id,
  ]);
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
  findAllTaskByProjectId,
  create,
  findAllByAreaId,
  update,
  remove,
  updateProgress,
};
