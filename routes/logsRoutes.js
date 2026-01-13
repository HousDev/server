// routes/activityLogsRoutes.js
const express = require("express");
const router = express.Router();
const activityLogsController = require("../controllers/logsController");

/**
 * GET /api/logs/:module/:entity_id
 * Fetch logs for a specific module and entity
 */
router.get("/", activityLogsController.getLogs);

module.exports = router;
