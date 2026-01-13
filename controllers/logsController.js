// controllers/activityLogsController.js
const activityLogsModel = require("../models/logsModel");

/**
 * Get logs for a specific module and entity
 */
const getLogs = async (req, res) => {
  try {
    const logs = await activityLogsModel.getLogs();

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Get Activity Logs Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  getLogs,
};
