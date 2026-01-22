// backend/controllers/areaTasks.controller.js
const areaTasksModel = require("../models/areaTasks.model");

// Get all main tasks (with optional filters)
const getAllTasks = async (req, res) => {
  try {
    const filters = {
      project_id: req.query.project_id,
      building_id: req.query.building_id,
      floor_id: req.query.floor_id,
      flat_id: req.query.flat_id,
      common_area_id: req.query.common_area_id,
      assigned_engineer: req.query.assigned_engineer,
    };

    const tasks = await areaTasksModel.findAll(filters);
    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("getAllTasks error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllTasksByProjectId = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await areaTasksModel.findAllByProjectId(projectId);

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("getAllTasks error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single main task by ID
const getTaskById = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await areaTasksModel.findById(id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("getTaskById error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create main task
const createTask = async (req, res) => {
  try {
    const data = req.body;

    // You can add backend validation here if required

    const task = await areaTasksModel.create(data);
    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("createTask error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update main task
const updateTask = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const existing = await areaTasksModel.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const updated = await areaTasksModel.update(id, data);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateTask error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete main task
const deleteTask = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await areaTasksModel.remove(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("deleteTask error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Toggle active status
const toggleTaskStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await areaTasksModel.toggleActive(id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("toggleTaskStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  getAllTasksByProjectId,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
};
