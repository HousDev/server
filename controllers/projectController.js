const projectModel = require("../models/projectModel");

// Create project with full hierarchy
const createProject = async (req, res) => {
  try {
    const projectData = req.body;
    // Validate required fields
    if (!projectData.name || !projectData.name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Project name is required",
      });
    }

    if (!projectData.location || !projectData.location.trim()) {
      return res.status(400).json({
        success: false,
        error: "Project location is required",
      });
    }

    const result = await projectModel.createProjectWithHierarchy(projectData);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating project:", error);

    // Handle validation errors
    if (error.message.includes("is required")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Handle database errors
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        error: "Project with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create project",
      details: error.message,
    });
  }
};

// Get project with full hierarchy
const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate project ID
    if (!projectId || isNaN(parseInt(projectId))) {
      return res.status(400).json({
        success: false,
        error: "Valid project ID is required",
      });
    }

    const project = await projectModel.getProjectHierarchy(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
      details: error.message,
    });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await projectModel.getAllProjects();

    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
      details: error.message,
    });
  }
};

// Get all employee projects
const getAllEmployeeProjects = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const projects = await projectModel.getAllEmployeeProjects(
      parseInt(employeeId),
    );

    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
      details: error.message,
    });
  }
};

// Comprehensive project update with hierarchy
const updateProjectHierarchy = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectData = req.body;
    // Validate project ID
    if (!projectId || isNaN(parseInt(projectId))) {
      return res.status(400).json({
        success: false,
        error: "Valid project ID is required",
      });
    }

    // Validate project exists
    const existingProject = await projectModel.getProjectHierarchy(
      parseInt(projectId),
    );
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const result = await projectModel.updateProjectWithHierarchy(
      parseInt(projectId),
      projectData,
    );

    res.json({
      success: true,
      message: "Project updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating project hierarchy:", error);

    // Handle validation errors
    if (
      error.message.includes("is required") ||
      error.message.includes("cannot be empty")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Handle database constraint errors
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        error: "Invalid reference to non-existing building or floor",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update project hierarchy",
      details: error.message,
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate project ID
    if (!projectId || isNaN(parseInt(projectId))) {
      return res.status(400).json({
        success: false,
        error: "Valid project ID is required",
      });
    }

    // Check if project exists
    const project = await projectModel.getProjectHierarchy(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const deleted = await projectModel.deleteProject(parseInt(projectId));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
      deletedProjectId: projectId,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
      details: error.message,
    });
  }
};

module.exports = {
  createProject,
  getProject,
  getAllEmployeeProjects,
  getAllProjects,
  updateProjectHierarchy,
  deleteProject,
};
