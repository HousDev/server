const NotificationModel = require("../models/notificationModel");

/**
 * GET /notifications
 */
async function getAllNotifications(req, res) {
  try {
    const notifications = await NotificationModel.findAllNotifications();
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

/**
 * GET /notifications/:id
 */
async function getNotificationById(req, res) {
  try {
    const { id } = req.params;

    const notifications = await NotificationModel.findByIdNotifications(id);

    if (!notifications.length) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notifications[0],
    });
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification",
    });
  }
}

/**
 * POST /notifications
 */
async function createNotification(req, res) {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description and type are required",
      });
    }

    const notification = await NotificationModel.createNotification({
      title,
      description,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    });
  }
}

/**
 * PATCH /notifications/:id/seen
 */
async function markNotificationAsSeen(req, res) {
  try {
    const { id } = req.params;

    const result = await NotificationModel.markNotificationAsSeen(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as seen",
    });
  } catch (error) {
    console.error("Mark seen error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
}

const markAllNotificationsAsSeen = async (req, res) => {
  try {
    const result = await NotificationModel.markAllNotificationsAsSeen();

    return res.status(200).json({
      success: true,
      message: "All notifications marked as seen",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Mark all notifications as seen error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as seen",
    });
  }
};

/**
 * DELETE /notifications/:id
 */
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    const result = await NotificationModel.deleteNotification(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
}

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsSeen,
  markAllNotificationsAsSeen,
  deleteNotification,
};
