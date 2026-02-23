const subTaskModel = require("../models/subTask.model");
const dailyLogModel = require("../models/subTaskLog.model");

/**
 * Helper: recalculate progress from daily logs
 */
const recalculateProgress = async (area_sub_task_id) => {
 
  const subTask = await subTaskModel.findById(area_sub_task_id);
  if (!subTask) return;

  const totalDone = await dailyLogModel.getTotalWorkDone(area_sub_task_id);

  const progress =
    subTask.total_work > 0
      ? Math.min((totalDone / subTask.total_work) * 100, 100)
      : 0;

  let status = "pending";
  if (progress > 0 && progress < 100) status = "in_progress";
  else if (progress >= 100) status = "completed";

  await subTaskModel.updateProgress(area_sub_task_id, progress, status);
};

/**
 * Get all sub-tasks (optionally filter by main task)
 */
exports.findAll = async (req, res) => {
  try {
    const filters = {};
    if (req.query.area_task_id) filters.area_task_id = req.query.area_task_id;

    const subTasks = await subTaskModel.findAll(filters);
    res.json(subTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findAllByEngineerId = async (req, res) => {
  try {
    const { engId } = req.params;
    if (!engId) {
      return res.status(400).json({ message: "Engineer Id not found." });
    }

    const subTasks = await subTaskModel.findAllByEngineer(engId);
    res.json(subTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findAllByAreaId = async (req, res) => {
  try {
    const areaId = req.params.areaId;
    if (!areaId) {
      return res.status(400).json({ message: "areaId required." });
    }
    const subTasks = await subTaskModel.findAllByAreaId(filters);
    res.json(subTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findTaskByProjects = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ message: "areaId required." });
    }

    const subTasks = await subTaskModel.findAllTaskByProjectId(projectId);
    res.json(subTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get sub-task by ID
 */
exports.findById = async (req, res) => {
  try {
    const subTask = await subTaskModel.findById(req.params.id);
    if (!subTask)
      return res.status(404).json({ message: "Sub-task not found" });
    res.json(subTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create new sub-task
 */
exports.create = async (req, res) => {
  try {
    const payload = req.body;
    if (
      !payload.project_id ||
      !payload.building_id ||
      !payload.floor_id ||
      !payload.engineer_id ||
      !payload.name ||
      !payload.unit ||
      !payload.total_work ||
      !payload.start_date ||
      !payload.end_date
    ) {
      return res.status(201).json({ message: "Fill required fields." });
    }
    const subTask = await subTaskModel.create(req.body);
    res
      .status(201)
      .json({ message: "Sub-task created", subTask, success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.engineerUpdateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    // Required fields validation
    if (
      !payload.engineer_id ||
      !payload.unit ||
      !payload.total_work ||
      !payload.start_date ||
      !payload.end_date
    ) {
      return res.status(404).json({ message: "Fill all required fields" });
    }
    // Handle uploaded files if any
    if (req.files && req.files.length > 0) {
      // Add photos information to payload
      payload.work_proof_photos = req.files.map(
        (file) => "/uploads/" + file.filename,
      );
    }

    // Parse numeric fields if they exist
    if (payload.today_work_completed) {
      payload.today_work_completed = parseFloat(payload.today_work_completed);
    }

    // Add timestamps for work update
    payload.last_updated_at = new Date();
    if (payload.today_work_completed) {
      payload.last_work_update = new Date();
    }

    const subTask = await subTaskModel.updateEngineerTask(
      req.params.id,
      payload,
    );

    if (!subTask) {
      // If update fails, you might want to delete uploaded files
      if (req.files && req.files.length > 0) {
        const fs = require("fs");
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }
      return res.status(404).json({ message: "Sub-task not found" });
    }

    res.json({
      message: "Sub-task updated successfully",
      subTask,
      success: true,
    });
  } catch (err) {
    console.log(err);
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      const fs = require("fs");
      req.files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });
    }
    res.status(500).json({ message: err.message });
  }
};


/**
 * Update sub-task
 */
exports.update = async (req, res) => {
  try {
    const payload = req.body;
    if (
      !payload.engineer_id ||
      !payload.unit ||
      !payload.total_work ||
      !payload.start_date ||
      !payload.end_date
    ) {
      return res.status(404).json({ message: "Fill all required fields" });
    }
    const subTask = await subTaskModel.update(req.params.id, req.body);
    if (!subTask)
      return res.status(404).json({ message: "Sub-task not found" });

    res.json({ message: "Sub-task updated", subTask, success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete sub-task
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await subTaskModel.remove(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Sub-task not found" });

    res.json({ message: "Sub-task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Recalculate and update progress manually (from daily logs)
 */
exports.recalculateProgress = async (req, res) => {
  try {
    await recalculateProgress(req.params.id);
    const updatedSubTask = await subTaskModel.findById(req.params.id);
    res.json({ message: "Progress recalculated", subTask: updatedSubTask });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
