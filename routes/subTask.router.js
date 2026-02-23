const express = require("express");
const router = express.Router();
const controller = require("../controllers/subTask.controller");
const upload = require("../middleware/upload"); // Adjust path as needed

// ✅ Get all sub-tasks (optionally filter by main task)
// GET /api/area-sub-tasks?area_task_id=12
router.get("/", controller.findAll);
router.get("/subTasks/:areaId", controller.findAllByAreaId);
router.get("/engineer/:engId/:projectId", controller.findAllByEngineerId);

router.get("/tasks/:projectId", controller.findTaskByProjects);

// ✅ Get single sub-task by ID
// GET /api/area-sub-tasks/:id
router.get("/:id", controller.findById);

// ✅ Create new sub-task
// POST /api/area-sub-tasks
router.post("/", controller.create);

router.put("/engineer/:id", upload.any(), controller.engineerUpdateTask);

// ✅ Update sub-task
// PUT /api/area-sub-tasks/:id
router.put("/:id", controller.update);

// ✅ Delete sub-task
// DELETE /api/area-sub-tasks/:id
router.delete("/:id", controller.remove);

// ✅ Recalculate progress manually (from daily logs)
// PUT /api/area-sub-tasks/:id/recalculate-progress
router.put("/:id/recalculate-progress", controller.recalculateProgress);

module.exports = router;
