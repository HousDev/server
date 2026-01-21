const dailyLogModel = require("../models/subTaskLog.model");
const subTaskModel = require("../models/subTask.model");

/**
 * Helper: recalculate sub-task progress based on daily logs
 */
const recalcSubTaskProgress = async (sub_task_id) => {
  const totalDone = await dailyLogModel.getTotalWorkDone(sub_task_id);
  const subTask = await subTaskModel.findById(sub_task_id);
  if (!subTask) return;

  const progress = subTask.total_work
    ? Math.min((totalDone / subTask.total_work) * 100, 100)
    : 0;

  let status = "pending";
  if (progress > 0 && progress < 100) status = "in_progress";
  else if (progress >= 100) status = "completed";
  b;
  await subTaskModel.updateProgress(sub_task_id, progress, status);
};

/**
 * Get all daily logs (optionally filter by sub-task)
 */
exports.findAll = async (req, res) => {
  try {
    const sub_task_id = req.params.id;
    console.log("task id", sub_task_id);
    if (!sub_task_id)
      return res.status(400).json({ message: "sub_task_id is required" });

    const logs = await dailyLogModel.findBySubTask(sub_task_id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get a daily log by ID
 */
exports.findById = async (req, res) => {
  try {
    const log = await dailyLogModel.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Daily log not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a daily log
 */
exports.create = async (req, res) => {
  try {
    const logId = await dailyLogModel.create(req.body);

    // Recalculate sub-task progress automatically
    await recalcSubTaskProgress(req.body.sub_task_id);

    const log = await dailyLogModel.findById(logId);
    res.status(201).json({ message: "Daily log created", log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update a daily log
 */
exports.update = async (req, res) => {
  try {
    const updated = await dailyLogModel.update(req.params.id, req.body);
    if (!updated)
      return res
        .status(404)
        .json({ message: "Daily log not found or no fields to update" });

    // Recalculate progress
    const log = await dailyLogModel.findById(req.params.id);
    await recalcSubTaskProgress(log.sub_task_id);

    res.json({ message: "Daily log updated", log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a daily log
 */
exports.remove = async (req, res) => {
  try {
    const log = await dailyLogModel.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Daily log not found" });

    const deleted = await dailyLogModel.remove(req.params.id);

    // Recalculate progress after deletion
    await recalcSubTaskProgress(log.sub_task_id);

    res.json({ message: "Daily log deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
