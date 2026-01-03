const commonAreaModel = require("../models/commonAreaModel");

// Update common area workflow
const updateCommonAreaWorkflow = async (req, res) => {
  try {
    const { commonAreaId } = req.params;
    const { workflow } = req.body;

    if (!Array.isArray(workflow)) {
      return res.status(400).json({
        success: false,
        error: "Workflow must be an array",
      });
    }

    const result = await commonAreaModel.updateCommonAreaWorkflow(
      commonAreaId,
      workflow
    );

    res.json({
      success: true,
      message: "Common area workflow updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating common area workflow:", error);

    if (
      error.message.includes("must be an array") ||
      error.message.includes("not found")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update common area workflow",
      details: error.message,
    });
  }
};

// Update single task in common area workflow
const updateCommonAreaTask = async (req, res) => {
  try {
    const { commonAreaId, taskId } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Valid status (pending, in_progress, completed) is required",
      });
    }

    const result = await commonAreaModel.updateCommonAreaTask(
      commonAreaId,
      parseInt(taskId),
      status
    );

    res.json({
      success: true,
      message: "Common area task updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating common area task:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update common area task",
      details: error.message,
    });
  }
};

// Get common area by ID
const getCommonArea = async (req, res) => {
  try {
    const { commonAreaId } = req.params;

    if (!commonAreaId || isNaN(parseInt(commonAreaId))) {
      return res.status(400).json({
        success: false,
        error: "Valid common area ID is required",
      });
    }

    const commonArea = await commonAreaModel.getCommonAreaById(
      parseInt(commonAreaId)
    );

    if (!commonArea) {
      return res.status(404).json({
        success: false,
        error: "Common area not found",
      });
    }

    res.json({
      success: true,
      data: commonArea,
    });
  } catch (error) {
    console.error("Error fetching common area:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch common area",
      details: error.message,
    });
  }
};

// Get common areas by floor
const getCommonAreasByFloor = async (req, res) => {
  try {
    const { floorId } = req.params;

    if (!floorId || isNaN(parseInt(floorId))) {
      return res.status(400).json({
        success: false,
        error: "Valid floor ID is required",
      });
    }

    const commonAreas = await commonAreaModel.getCommonAreasByFloor(
      parseInt(floorId)
    );

    res.json({
      success: true,
      data: commonAreas,
      count: commonAreas.length,
    });
  } catch (error) {
    console.error("Error fetching common areas by floor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch common areas",
      details: error.message,
    });
  }
};

module.exports = {
  updateCommonAreaWorkflow,
  updateCommonAreaTask,
  getCommonArea,
  getCommonAreasByFloor,
};
