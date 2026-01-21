const { promisePool } = require("../config/db");

/**
 * Create a daily log
 */
const create = async (data) => {
  const sql = `
    INSERT INTO area_task_daily_logs (
      sub_task_id,
      vendor_id,
      work_date,
      work_done,
      manpower,
      machines_used,
      issue,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.sub_task_id,
    data.vendor_id,
    data.work_date,
    data.work_done,
    data.manpower,
    data.machines_used ? JSON.stringify(data.machines_used) : null,
    data.issue || null,
    data.created_by,
  ];

  const [result] = await promisePool.query(sql, values);
  return result.insertId;
};

/**
 * Get logs by sub-task
 */
const findBySubTask = async (sub_task_id) => {
  const [rows] = await promisePool.query(
    `SELECT * FROM area_task_daily_logs
     WHERE sub_task_id = ?
     ORDER BY work_date ASC`,
    [sub_task_id],
  );

  return rows.map((row) => ({
    ...row,
    machines_used:
      typeof row.machines_used === "string"
        ? JSON.parse(row.machines_used)
        : row.machines_used || [],
  }));
};

/**
 * Get single log by ID
 */
const findById = async (id) => {
  const [rows] = await promisePool.query(
    `SELECT * FROM area_task_daily_logs WHERE id = ?`,
    [id],
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    machines_used: rows[0].machines_used
      ? JSON.parse(rows[0].machines_used)
      : [],
  };
};

/**
 * Update a daily log
 * Only allow updating work_done, manpower, machines_used, issue
 */
const update = async (id, data) => {
  const allowed = ["work_done", "manpower", "machines_used", "issue"];
  const fields = [];
  const values = [];

  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(
        key === "machines_used" ? JSON.stringify(data[key]) : data[key],
      );
    }
  });

  if (!fields.length) return false;

  values.push(id);

  const sql = `UPDATE area_task_daily_logs SET ${fields.join(", ")} WHERE id = ?`;
  const [result] = await promisePool.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Delete a daily log
 */
const remove = async (id) => {
  const [result] = await promisePool.query(
    `DELETE FROM area_task_daily_logs WHERE id = ?`,
    [id],
  );
  return result.affectedRows > 0;
};

/**
 * Get total work done for a sub-task
 */
const getTotalWorkDone = async (sub_task_id) => {
  const [rows] = await promisePool.query(
    `SELECT IFNULL(SUM(work_done),0) AS total_done FROM area_task_daily_logs WHERE sub_task_id = ?`,
    [sub_task_id],
  );
  return rows[0].total_done;
};

module.exports = {
  create,
  findBySubTask,
  findById,
  update,
  remove,
  getTotalWorkDone,
};
