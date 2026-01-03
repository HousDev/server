const flatModel = require("../models/flatModel");

// Update flat workflow
const updateFlatWorkflow = async (req, res) => {
  try {
    const { flatId } = req.params;
    const { workflow } = req.body;

    if (!Array.isArray(workflow)) {
      return res.status(400).json({
        success: false,
        error: "Workflow must be an array",
      });
    }

    const result = await flatModel.updateFlatWorkflow(flatId, workflow);

    res.json({
      success: true,
      message: "Flat workflow updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating flat workflow:", error);

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
      error: "Failed to update flat workflow",
      details: error.message,
    });
  }
};

// Update single task in flat workflow
const updateFlatTask = async (req, res) => {
  try {
    const { flatId, taskId } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Valid status (pending, in_progress, completed) is required",
      });
    }

    const result = await flatModel.updateFlatTask(
      flatId,
      parseInt(taskId),
      status
    );

    res.json({
      success: true,
      message: "Flat task updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating flat task:", error);

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
      error: "Failed to update flat task",
      details: error.message,
    });
  }
};

// Get flat by ID
const getFlat = async (req, res) => {
  try {
    const { flatId } = req.params;
    if (!flatId || isNaN(parseInt(flatId))) {
      return res.status(400).json({
        success: false,
        error: "Valid flat ID is required",
      });
    }

    const flat = await flatModel.getFlatById(parseInt(flatId));

    if (!flat) {
      return res.status(404).json({
        success: false,
        error: "Flat not found",
      });
    }

    res.json({
      success: true,
      data: flat,
    });
  } catch (error) {
    console.error("Error fetching flat:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch flat",
      details: error.message,
    });
  }
};

// Get flats by floor
const getFlatsByFloor = async (req, res) => {
  try {
    const { floorId } = req.params;

    if (!floorId || isNaN(parseInt(floorId))) {
      return res.status(400).json({
        success: false,
        error: "Valid floor ID is required",
      });
    }

    const flats = await flatModel.getFlatsByFloor(parseInt(floorId));

    res.json({
      success: true,
      data: flats,
      count: flats.length,
    });
  } catch (error) {
    console.error("Error fetching flats by floor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch flats",
      details: error.message,
    });
  }
};

module.exports = {
  updateFlatWorkflow,
  updateFlatTask,
  getFlat,
  getFlatsByFloor,
};
