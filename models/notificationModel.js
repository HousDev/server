const { query } = require("../config/db");

async function findAllNotifications(filters = {}) {
  let queryStr = `
    SELECT * FROM notifications
    WHERE 1=1
  `;

  const params = [];

  // 🔍 Filters
  if (filters.type) {
    queryStr += " AND type = ?";
    params.push(filters.type);
  }

  if (filters.user_id) {
    queryStr += " AND user_id = ?";
    params.push(filters.user_id);
  }

  if (filters.seen !== undefined) {
    queryStr += " AND seen = ?";
    params.push(filters.seen);
  }

  if (filters.start_date) {
    queryStr += " AND created_at >= ?";
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    queryStr += " AND created_at <= ?";
    params.push(filters.end_date);
  }

  if (filters.search) {
    queryStr += " AND (title LIKE ? OR description LIKE ?)";
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  // 🧠 Sorting
  queryStr += " ORDER BY created_at DESC";
  console.log(queryStr);
  return await query(queryStr, params);
}

async function findByIdNotifications(id) {
  return await query("SELECT * FROM notifications WHERE id=?", [id]);
}

async function createNotification(payload) {
  const { title, description, type } = payload;

  const result = await query(
    `INSERT INTO notifications (title, description, type)
     VALUES (?, ?, ?)`,
    [title, description, type],
  );

  // return newly created notification
  const [notification] = await query(
    `SELECT * FROM notifications WHERE id = ?`,
    [result.insertId],
  );

  return notification;
}

async function markNotificationAsSeen(id) {
  return await query("UPDATE notifications SET seen = ? WHERE id = ?", [
    true,
    id,
  ]);
}

async function markAllNotificationsAsSeen() {
  return await query(
    `UPDATE notifications 
     SET seen = true 
     WHERE seen = false`,
  );
}

async function deleteNotification(id) {
  return await query("DELETE FROM notifications WHERE id = ?", [id]);
}

module.exports = {
  findAllNotifications,
  findByIdNotifications,
  createNotification,
  deleteNotification,
  markNotificationAsSeen,
  markAllNotificationsAsSeen,
};
