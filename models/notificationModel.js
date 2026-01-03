const { query } = require("../config/db");

async function findAllNotifications() {
  return await query("SELECT * FROM notifications ORDER BY created_at DESC");
}

async function findByIdNotifications(id) {
  return await query("SELECT * FROM notifications WHERE id=?", [id]);
}

async function createNotification(payload) {
  const { title, description, type } = payload;

  const result = await query(
    `INSERT INTO notifications (title, description, type)
     VALUES (?, ?, ?)`,
    [title, description, type]
  );

  // return newly created notification
  const [notification] = await query(
    `SELECT * FROM notifications WHERE id = ?`,
    [result.insertId]
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
     WHERE seen = false`
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
