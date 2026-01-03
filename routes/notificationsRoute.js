const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationsController");

router.get("/", controller.getAllNotifications);
router.get("/:id", controller.getNotificationById);
router.post("/", controller.createNotification);
router.put("/:id/seen", controller.markNotificationAsSeen);
router.put("/mark-all-seen", controller.markAllNotificationsAsSeen);
router.delete("/:id", controller.deleteNotification);

module.exports = router;
