const express = require("express");
const ProjectDetailsRouter = express.Router();

const {
  getAllProjectDetails,
  getProjectDetailsById,
  createProjectDetails,
  updateProjectDetails,
  deleteProjectDetails,
} = require("../controllers/projectDetailsController");

/**
 * Project details routes
 */

// Create project detail
ProjectDetailsRouter.post("/", createProjectDetails);

// Get all project details
ProjectDetailsRouter.get("/", getAllProjectDetails);

// Get project detail by ID
ProjectDetailsRouter.get("/:id", getProjectDetailsById);

// Update project detail
ProjectDetailsRouter.put("/:id", updateProjectDetails);

// Delete project detail
ProjectDetailsRouter.delete("/:id", deleteProjectDetails);

module.exports = ProjectDetailsRouter;
