const { pool, query } = require("../config/db");
const {
  calculateWorkflowProgress,
} = require("../utils/projectsUtils/progressCalculator");
const {
  updateFloorProgress,
  updateBuildingProgress,
  updateProjectProgress,
} = require("./flatModel");

// Update common area workflow and cascade progress updates
const updateCommonAreaWorkflow = async (commonAreaId, workflow) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Validate workflow structure
    if (!Array.isArray(workflow)) {
      throw new Error("Workflow must be an array");
    }

    // Calculate common area progress
    const { progress, status } = calculateWorkflowProgress(workflow);

    // Update common area
    await connection.execute(
      `UPDATE common_areas 
       SET workflow = ?, progress_percentage = ?, status = ?
       WHERE id = ?`,
      [JSON.stringify(workflow), progress, status, commonAreaId]
    );

    // Get floor ID
    const [commonAreaRows] = await connection.execute(
      "SELECT floor_id FROM common_areas WHERE id = ?",
      [commonAreaId]
    );

    let buildingId = null;
    let projectId = null;

    if (commonAreaRows.length > 0) {
      // Update floor progress and get buildingId
      buildingId = await updateFloorProgress(
        commonAreaRows[0].floor_id,
        connection
      );

      if (buildingId) {
        // Update building progress and get projectId
        projectId = await updateBuildingProgress(buildingId, connection);

        if (projectId) {
          // Update project progress
          await updateProjectProgress(projectId, connection);
        }
      }
    }

    await connection.commit();
    connection.release();

    return {
      success: true,
      progress,
      status,
      commonAreaId,
      buildingId,
      projectId,
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

// Update single task in common area workflow
const updateCommonAreaTask = async (commonAreaId, taskId, newStatus) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get current common area data
    const [commonAreas] = await connection.execute(
      "SELECT workflow FROM common_areas WHERE id = ?",
      [commonAreaId]
    );

    if (commonAreas.length === 0) {
      throw new Error("Common area not found");
    }

    let workflow = commonAreas[0].workflow;

    // Parse workflow if it's a string
    if (typeof workflow === "string") {
      try {
        workflow = JSON.parse(workflow);
      } catch {
        workflow = [];
      }
    }

    if (!Array.isArray(workflow)) {
      throw new Error("Invalid workflow format");
    }

    // Find and update the task
    let taskUpdated = false;
    const updatedWorkflow = workflow.map((task) => {
      if (task.id === taskId) {
        taskUpdated = true;
        return { ...task, status: newStatus };
      }
      return task;
    });

    if (!taskUpdated) {
      throw new Error(`Task with id ${taskId} not found in workflow`);
    }

    // Calculate new progress
    const { progress, status } = calculateWorkflowProgress(updatedWorkflow);

    // Update common area
    await connection.execute(
      `UPDATE common_areas 
       SET workflow = ?, progress_percentage = ?, status = ?
       WHERE id = ?`,
      [JSON.stringify(updatedWorkflow), progress, status, commonAreaId]
    );

    // Get floor ID for cascading
    const [commonAreaRows] = await connection.execute(
      "SELECT floor_id FROM common_areas WHERE id = ?",
      [commonAreaId]
    );

    let buildingId = null;
    let projectId = null;

    if (commonAreaRows.length > 0) {
      // Update floor progress and get buildingId
      buildingId = await updateFloorProgress(
        commonAreaRows[0].floor_id,
        connection
      );

      if (buildingId) {
        // Update building progress and get projectId
        projectId = await updateBuildingProgress(buildingId, connection);

        if (projectId) {
          // Update project progress
          await updateProjectProgress(projectId, connection);
        }
      }
    }

    await connection.commit();
    connection.release();

    return {
      success: true,
      taskUpdated: {
        taskId,
        newStatus,
      },
      commonAreaProgress: progress,
      commonAreaStatus: status,
      buildingId,
      projectId,
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

// Get common area by ID
const getCommonAreaById = async (commonAreaId) => {
  try {
    const commonAreas = await query("SELECT * FROM common_areas WHERE id = ?", [
      commonAreaId,
    ]);

    if (commonAreas.length === 0) {
      return null;
    }

    const commonArea = commonAreas[0];

    // Parse workflow JSON if it's a string
    if (typeof commonArea.workflow === "string") {
      try {
        commonArea.workflow = JSON.parse(commonArea.workflow);
      } catch (error) {
        commonArea.workflow = [];
      }
    }

    return commonArea;
  } catch (error) {
    console.error("Error fetching common area:", error);
    throw error;
  }
};

// Get all common areas for a floor
const getCommonAreasByFloor = async (floorId) => {
  try {
    const commonAreas = await query(
      "SELECT * FROM common_areas WHERE floor_id = ? ORDER BY id",
      [floorId]
    );

    // Parse workflow JSON for each common area
    return commonAreas.map((area) => {
      if (typeof area.workflow === "string") {
        try {
          area.workflow = JSON.parse(area.workflow);
        } catch (error) {
          area.workflow = [];
        }
      }
      return area;
    });
  } catch (error) {
    console.error("Error fetching common areas by floor:", error);
    throw error;
  }
};

module.exports = {
  updateCommonAreaWorkflow,
  updateCommonAreaTask,
  getCommonAreaById,
  getCommonAreasByFloor,
};
