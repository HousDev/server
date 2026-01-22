// backend/models/areaTasks.model.js
const { promisePool } = require("../config/db");

// Get all tasks with FK names
const findAll = async (filters = {}) => {
  let sql = `
    SELECT 
      at.*,
      p.name AS project_name,
      b.building_name,
      f.floor_name,
      fl.flat_name,
      ca.common_area_name,
      u1.full_name AS assigned_engineer_name,
      u2.full_name AS created_by_name
    FROM area_tasks at
    LEFT JOIN projects p ON at.project_id = p.id
    LEFT JOIN buildings b ON at.building_id = b.id
    LEFT JOIN floors f ON at.floor_id = f.id
    LEFT JOIN flats fl ON at.flat_id = fl.id
    LEFT JOIN common_areas ca ON at.common_area_id = ca.id
    LEFT JOIN users u1 ON at.assigned_engineer = u1.id
    LEFT JOIN users u2 ON at.created_by = u2.id
    WHERE 1=1
  `;

  const vals = [];
  if (filters.project_id) {
    sql += " AND at.project_id = ?";
    vals.push(filters.project_id);
  }
  if (filters.building_id) {
    sql += " AND at.building_id = ?";
    vals.push(filters.building_id);
  }
  if (filters.floor_id) {
    sql += " AND at.floor_id = ?";
    vals.push(filters.floor_id);
  }
  if (filters.flat_id) {
    sql += " AND at.flat_id = ?";
    vals.push(filters.flat_id);
  }
  if (filters.common_area_id) {
    sql += " AND at.common_area_id = ?";
    vals.push(filters.common_area_id);
  }
  if (filters.assigned_engineer) {
    sql += " AND at.assigned_engineer = ?";
    vals.push(filters.assigned_engineer);
  }

  sql += " ORDER BY at.start_date DESC";

  const [rows] = await promisePool.query(sql, vals);
  return rows;
};

const findAllByProjectId = async (project_id) => {
  let sql = `
    SELECT 
      at.*,
      p.name AS project_name,
      b.building_name,
      f.floor_name,
      fl.flat_name,
      ca.common_area_name,
      u1.full_name AS assigned_engineer_name,
      u2.full_name AS created_by_name
    FROM area_tasks at
    LEFT JOIN projects p ON at.project_id = p.id
    LEFT JOIN buildings b ON at.building_id = b.id
    LEFT JOIN floors f ON at.floor_id = f.id
    LEFT JOIN flats fl ON at.flat_id = fl.id
    LEFT JOIN common_areas ca ON at.common_area_id = ca.id
    LEFT JOIN users u1 ON at.assigned_engineer = u1.id
    LEFT JOIN users u2 ON at.created_by = u2.id
    WHERE at.project_id = ?
  `;

  const [rows] = await promisePool.query(sql, [Number(project_id)]);
  return rows;
};

// Get single task by ID with FK names
const findById = async (id) => {
  const [rows] = await promisePool.query(
    `
      SELECT 
        at.*,
        p.name AS project_name,
        b.building_name,
        f.floor_name,
        fl.flat_name,
        ca.common_area_name,
        u1.full_name AS assigned_engineer_name,
        u2.full_name AS created_by_name
      FROM area_tasks at
      LEFT JOIN projects p ON at.project_id = p.id
      LEFT JOIN buildings b ON at.building_id = b.id
      LEFT JOIN floors f ON at.floor_id = f.id
      LEFT JOIN flats fl ON at.flat_id = fl.id
      LEFT JOIN common_areas ca ON at.common_area_id = ca.id
      LEFT JOIN users u1 ON at.assigned_engineer = u1.id
      LEFT JOIN users u2 ON at.created_by = u2.id
      WHERE at.id = ?
    `,
    [id],
  );

  return rows[0] || null;
};

// Create new task
const create = async (data) => {
  const {
    project_id,
    building_id,
    floor_id,
    flat_id = null,
    common_area_id = null,
    assigned_engineer,
    start_date,
    expected_end_date,
    created_by,
    is_active = 1,
  } = data;

  const [result] = await promisePool.query(
    `INSERT INTO area_tasks 
      (project_id, building_id, floor_id, flat_id, common_area_id, assigned_engineer, start_date, expected_end_date, created_by, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project_id,
      building_id,
      floor_id,
      flat_id,
      common_area_id,
      assigned_engineer,
      start_date,
      expected_end_date,
      created_by,
      is_active ? 1 : 0,
    ],
  );

  return await findById(result.insertId);
};

// Update task
const update = async (id, data) => {
  const fields = [];
  const vals = [];
  const allowed = [
    "project_id",
    "building_id",
    "floor_id",
    "flat_id",
    "common_area_id",
    "assigned_engineer",
    "start_date",
    "expected_end_date",
    "progress",
    "status",
    "is_active",
  ];

  allowed.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      fields.push(`${k} = ?`);
      vals.push(data[k]);
    }
  });

  if (fields.length === 0) return await findById(id);

  vals.push(id);
  const sql = `UPDATE area_tasks SET ${fields.join(", ")} WHERE id = ?`;
  await promisePool.query(sql, vals);

  return await findById(id);
};

// Delete task
const remove = async (id) => {
  const [result] = await promisePool.query(
    "DELETE FROM area_tasks WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

// Toggle active status
const toggleActive = async (id) => {
  const task = await findById(id);
  if (!task) return null;
  const newStatus = task.is_active ? 0 : 1;
  await promisePool.query("UPDATE area_tasks SET is_active = ? WHERE id = ?", [
    newStatus,
    id,
  ]);
  return await findById(id);
};

module.exports = {
  findAll,
  findById,
  findAllByProjectId,
  create,
  update,
  remove,
  toggleActive,
};
