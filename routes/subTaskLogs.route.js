const express = require("express");
const router = express.Router();
const controller = require("../controllers/subTaskLogs.controller");

/**
 * Get all daily logs for a sub-task
 * GET /api/area-task-daily-logs?sub_task_id=123
 */
router.get("/byMainTask/:id", controller.findAll);

/**
 * Get a single daily log by ID
 * GET /api/area-task-daily-logs/:id
 */
router.get("/:id", controller.findById);

/**
 * Create a new daily log
 * POST /api/area-task-daily-logs
 */
router.post("/", controller.create);

/**
 * Update an existing daily log
 * PUT /api/area-task-daily-logs/:id
 */
router.put("/:id", controller.update);

/**
 * Delete a daily log
 * DELETE /api/area-task-daily-logs/:id
 */
router.delete("/:id", controller.remove);

module.exports = router;
