const { query } = require("../config/db");

/**
 * Get all PO payment reminders
 */
async function findAllReminders() {
  return await query(
    `SELECT *
     FROM po_payment_reminder
     ORDER BY created_at DESC`
  );
}

/**
 * Get reminder by ID
 */
async function findReminderById(id) {
  const [reminder] = await query(
    `SELECT *
     FROM po_payment_reminder
     WHERE id = ?`,
    [id]
  );

  return reminder;
}

/**
 * Create PO payment reminder
 */
async function createReminder(payload) {
  const {
    po_id,
    po_number,
    vendor,
    total_amount,
    total_paid,
    balance_amount,
    due_date,
    status = "unseen",
    seen_by = null,
  } = payload;

  const result = await query(
    `INSERT INTO po_payment_reminder (
      po_id,
      po_number,
      vendor,
      total_amount,
      total_paid,
      balance_amount,
      due_date,
      status,
      seen_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      po_id,
      po_number,
      vendor,
      total_amount,
      total_paid,
      balance_amount,
      due_date,
      status,
      seen_by,
    ]
  );

  // return newly created reminder
  const [reminder] = await query(
    `SELECT *
     FROM po_payment_reminder
     WHERE id = ?`,
    [result.insertId]
  );

  return reminder;
}

/**
 * Mark reminder as seen
 */
async function markReminderAsSeen(id, seen_by) {
  return await query(
    `UPDATE po_payment_reminder
     SET status = 'seen',
         seen_by = ?
     WHERE id = ?`,
    [seen_by, id]
  );
}

/**
 * Mark all reminders as seen for a user
 */
async function markAllRemindersAsSeen(userId) {
  return await query(
    `UPDATE po_payment_reminder
     SET status = 'seen',
         seen_by = ?
     WHERE status = 'unseen'`,
    [userId]
  );
}

/**
 * Delete reminder (hard delete)
 */
async function deleteReminder(id) {
  return await query(
    `DELETE FROM po_payment_reminder
     WHERE id = ?`,
    [id]
  );
}

module.exports = {
  findAllReminders,
  findReminderById,
  createReminder,
  markReminderAsSeen,
  markAllRemindersAsSeen,
  deleteReminder,
};
