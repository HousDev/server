const poPaymentReminderModel = require("../models/poPaymentReminderModel");

/**
 * Get all PO payment reminders
 */
exports.getReminders = async (req, res) => {
  try {
    const reminders = await poPaymentReminderModel.findAllReminders();
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
};

/**
 * Get reminder by ID
 */
exports.getReminderById = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await poPaymentReminderModel.findReminderById(id);

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reminder" });
  }
};

/**
 * Create PO payment reminder
 */
exports.createReminder = async (req, res) => {
  try {
    const {
      po_id,
      po_number,
      vendor,
      total_amount,
      total_paid,
      balance_amount,
      due_date,
    } = req.body;

    // basic validation
    if (!po_id || !po_number || !vendor || !balance_amount || !due_date) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    const reminder = await poPaymentReminderModel.createReminder({
      po_id,
      po_number,
      vendor,
      total_amount,
      total_paid,
      balance_amount,
      due_date,
    });

    res.status(201).json({
      success: true,
      message: "Payment reminder created successfully",
      reminder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create reminder" });
  }
};

/**
 * Mark reminder as seen
 */
exports.markReminderAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const { seen_by } = req.body; // or req.user.id if you use auth middleware

    if (!seen_by) {
      return res.status(400).json({ message: "all fields required" });
    }

    const result = await poPaymentReminderModel.markReminderAsSeen(id, seen_by);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ success: true, message: "Reminder marked as seen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update reminder" });
  }
};

/**
 * Mark all reminders as seen (for a user)
 */
exports.markAllRemindersAsSeen = async (req, res) => {
  try {
    const { user_id } = req.body; // or req.user.id

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    await poPaymentReminderModel.markAllRemindersAsSeen(user_id);

    res.json({ success: true, message: "All reminders marked as seen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update reminders" });
  }
};

/**
 * Delete reminder (hard delete)
 */
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await poPaymentReminderModel.deleteReminder(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ message: "Reminder deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete reminder" });
  }
};
