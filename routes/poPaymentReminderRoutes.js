const express = require("express");
const router = express.Router();
const poPaymentReminderController = require("../controllers/poPaymentReminderController");

// ---------------------------
// Routes
// ---------------------------

// Get all reminders
router.get("/", poPaymentReminderController.getReminders);

// Get reminder by ID
router.get("/:id", poPaymentReminderController.getReminderById);

// Create new payment reminder
router.post("/", poPaymentReminderController.createReminder);

// Mark reminder as seen
router.put("/:id/seen", poPaymentReminderController.markReminderAsSeen);

// Mark all reminders as seen
router.put("/seen-all", poPaymentReminderController.markAllRemindersAsSeen);

// Delete reminder
router.delete("/:id", poPaymentReminderController.deleteReminder);

module.exports = router;
