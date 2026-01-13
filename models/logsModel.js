// models/activityLogsModel.js
const { query } = require("../config/db");

/**
 * Create a new activity log
 */

//createActivityLog("module","entity_id","action","message","user_id")

const createActivityLog = async (
  module,
  entity_id,
  action,
  message = null,
  user_id
) => {
  if (!module || !entity_id || !action || !user_id) {
    throw new Error("Missing required log fields");
  }

  const result = await query(
    `
    INSERT INTO activity_logs
      (module, entity_id, action, message, user_id)
    VALUES (?, ?, ?, ?, ?)
    `,
    [module, entity_id, action, message, user_id]
  );

  return result.insertId;
};

/**
 * Get logs for a specific entity
 */
const getLogs = async () => {
  return await query(
    `
    SELECT
      al.id,
      al.action,
      al.message,
      al.created_at,
      al.user_id,
      u.full_name AS user_name
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    `
  );
};

module.exports = {
  createActivityLog,
  getLogs,
};
