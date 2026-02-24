// backend/models/subTask.model.js
const { promisePool, pool } = require("../config/db");

/**
 * Get all sub-tasks (optionally by main task)
 */
const findAll = async (filters = {}) => {
  let sql = `SELECT ast.*,atwl.id AS log_id,atwl.work_done AS log_work_done, atwl.work_unit AS log_work_unit, 
  atwl.photos, atwl.issue, atwl.created_by AS log_created_by 
  FROM area_sub_tasks AS ast LEFT JOIN area_task_work_logs AS atwl ON atwl.area_sub_task_id = ast.id 
  ORDER BY ast.created_at DESC`;

  const [rows] = await promisePool.query(sql);
  return rows;
};

const findAllByEngineer = async (engId, projectId) => {
  console.log(projectId);
  let sql = `SELECT ast.*,atwl.id AS log_id,atwl.work_done AS log_work_done, atwl.work_unit AS log_work_unit, 
  atwl.photos, atwl.issue, u.full_name AS log_created_by 
  FROM area_sub_tasks AS ast LEFT JOIN area_task_work_logs AS atwl ON atwl.area_sub_task_id = ast.id LEFT JOIN users AS u
  ON u.id=atwl.created_by  where ast.engineer_id = ? AND ast.project_id = ?
  ORDER BY ast.created_at DESC`;

  const [rows] = await promisePool.query(sql, [engId, projectId]);
  return rows;
};

const findAllTaskByProjectId = async (projectId) => {
  console.log(projectId);

  const sql = `SELECT ast.*,atwl.id AS log_id,atwl.work_done AS log_work_done, atwl.work_unit AS log_work_unit, 
  atwl.photos, atwl.issue, u.full_name AS log_created_by 
  FROM area_sub_tasks AS ast LEFT JOIN area_task_work_logs AS atwl ON atwl.area_sub_task_id = ast.id LEFT JOIN users AS u
  ON u.id=atwl.created_by  where ast.project_id = ?
  ORDER BY ast.created_at DESC`;

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
  console.log(data);
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

  await promisePool.query(
    `INSERT INTO notifications (title, description, type)
     VALUES (?, ?, ?)`,
    [
      "New Task Assigned",
      "You have new task check in task management.",
      "Info",
    ],
  );

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

const updateEngineerTask = async (id, data) => {
  // Use destructuring and provide default fallbacks
  try {
    const {
      today_work_completed,
      today_work_unit,
      issue,
      engineer_id,
      work_proof_photos,
      total_work,
    } = data;

    const conn = await pool.getConnection();
    await conn.beginTransaction();
    const work_done =
      today_work_unit === "sqm"
        ? Number(today_work_completed) * 10.7639
        : today_work_completed;
    const [[ast]] = await conn.query(
      "SELECT * FROM area_sub_tasks WHERE id = ?",
      [id],
    );
    const progress =
      (Number(today_work_completed) * 100) / Number(total_work) +
      Number(ast.progress);

    const sql = `
    UPDATE area_sub_tasks
    SET work_done=work_done + ?, progress=?, status=?
    WHERE id = ?
  `;

    await conn.query(sql, [
      work_done,
      progress,
      Number(progress) > 0 && Number(progress) < 100
        ? "in progress"
        : Number(progress) >= 100
          ? "completed"
          : "pending",
      id,
    ]);

    await conn.query(
      `INSERT INTO area_task_work_logs(area_sub_task_id, work_done, work_unit, photos, issue, created_by) VALUES(?,?,?,?,?,?)`,
      [
        id,
        today_work_completed,
        today_work_unit,
        JSON.stringify(work_proof_photos),
        issue,
        engineer_id,
      ],
    );

    await conn.query(
      `INSERT INTO notifications (title, description, type)
     VALUES (?, ?, ?)`,
      [
        "Task Updated",
        `Task updated by user ${engineer_id}, check in task management for details.`,
        "Info",
      ],
    );

    await conn.commit();
    return await findById(id);
  } catch (error) {
    console.log(error);
  }
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
  findAllByEngineer,
  create,
  findAllByAreaId,
  update,
  remove,
  updateProgress,
  updateEngineerTask,
};
