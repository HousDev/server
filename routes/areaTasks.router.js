// backend/routes/areaTasks.routes.js
const express = require("express");
const router = express.Router();
const areaTasksController = require("../controllers/areaTasks.controller");

// =======================
// ROUTES
// =======================

// Get all main tasks (optionally filtered by project/building/floor/area/engineer)
router.get("/", areaTasksController.getAllTasks);

// Get a single main task by ID
router.get("/:id", areaTasksController.getTaskById);

// Create a new main task
router.post("/", areaTasksController.createTask);

// Update an existing main task
router.put("/:id", areaTasksController.updateTask);

// Delete a main task
router.delete("/:id", areaTasksController.deleteTask);

// Toggle active status
router.patch("/:id/toggle-active", areaTasksController.toggleTaskStatus);

module.exports = router;
