const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");

// Project CRUD routes
router.post("/", projectController.createProject); // Create project with hierarchy
router.get("/", projectController.getAllProjects); // Get all projects
router.get("/:projectId", projectController.getProject); // Get project with hierarchy
router.put("/:projectId", projectController.updateProjectHierarchy); // Full hierarchy update
router.delete("/:projectId", projectController.deleteProject); // Delete project

module.exports = router;
