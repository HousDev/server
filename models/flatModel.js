const { pool, query } = require("../config/db");
const {
  calculateWorkflowProgress,
  calculateAggregateProgress,
  calculateAggregateStatus,
} = require("../utils/projectsUtils/progressCalculator");

// Helper function to update floor progress (will be used in flat and common area updates)
const updateFloorProgress = async (floorId, connection = null) => {
  const useExternalConnection = !!connection;
  if (!connection) {
    connection = await pool.getConnection();
  }

  try {
    if (!useExternalConnection) await connection.beginTransaction();

    // Get all flats in this floor
    const [flats] = await connection.execute(
      "SELECT progress_percentage FROM flats WHERE floor_id = ?",
      [floorId]
    );

    // Get all common areas in this floor
    const [commonAreas] = await connection.execute(
      "SELECT progress_percentage FROM common_areas WHERE floor_id = ?",
      [floorId]
    );

    // Combine all items
    const allItems = [...flats, ...commonAreas];

    // Calculate floor progress and status
    const floorProgress = calculateAggregateProgress(allItems);
    const floorStatus = calculateAggregateStatus(allItems);

    // Update floor
    await connection.execute(
      `UPDATE floors 
       SET progress_percentage = ?, status = ?
       WHERE id = ?`,
      [floorProgress, floorStatus, floorId]
    );

    // Get building ID for further cascading
    const [floorRows] = await connection.execute(
      "SELECT building_id FROM floors WHERE id = ?",
      [floorId]
    );

    if (!useExternalConnection) await connection.commit();

    // Return buildingId for further cascading
    return floorRows.length > 0 ? floorRows[0].building_id : null;
  } catch (error) {
    if (!useExternalConnection) {
      await connection.rollback();
      connection.release();
    }
    throw error;
  } finally {
    if (!useExternalConnection && connection) {
      connection.release();
    }
  }
};

// Helper function to update building progress
const updateBuildingProgress = async (buildingId, connection = null) => {
  const useExternalConnection = !!connection;
  if (!connection) {
    connection = await pool.getConnection();
  }

  try {
    if (!useExternalConnection) await connection.beginTransaction();

    // Get all floors in this building
    const [floors] = await connection.execute(
      "SELECT progress_percentage FROM floors WHERE building_id = ?",
      [buildingId]
    );

    // Calculate building progress and status
    const buildingProgress = calculateAggregateProgress(floors);
    const buildingStatus = calculateAggregateStatus(floors);

    // Update building
    await connection.execute(
      `UPDATE buildings 
       SET progress_percentage = ?, status = ?
       WHERE id = ?`,
      [buildingProgress, buildingStatus, buildingId]
    );

    // Get project ID for further cascading
    const [buildingRows] = await connection.execute(
      "SELECT project_id FROM buildings WHERE id = ?",
      [buildingId]
    );

    if (!useExternalConnection) await connection.commit();

    // Return projectId for further cascading
    return buildingRows.length > 0 ? buildingRows[0].project_id : null;
  } catch (error) {
    if (!useExternalConnection) {
      await connection.rollback();
      connection.release();
    }
    throw error;
  } finally {
    if (!useExternalConnection && connection) {
      connection.release();
    }
  }
};

// Helper function to update project progress
const updateProjectProgress = async (projectId, connection = null) => {
  const useExternalConnection = !!connection;
  if (!connection) {
    connection = await pool.getConnection();
  }

  try {
    if (!useExternalConnection) await connection.beginTransaction();

    // Get all buildings in this project
    const [buildings] = await connection.execute(
      "SELECT progress_percentage FROM buildings WHERE project_id = ?",
      [projectId]
    );

    // Calculate project progress and status
    const projectProgress = calculateAggregateProgress(buildings);
    const projectStatus = calculateAggregateStatus(buildings);

    // Update project
    await connection.execute(
      `UPDATE projects 
       SET progress_percentage = ?, status = ?
       WHERE id = ?`,
      [projectProgress, projectStatus, projectId]
    );

    if (!useExternalConnection) await connection.commit();
  } catch (error) {
    if (!useExternalConnection) {
      await connection.rollback();
      connection.release();
    }
    throw error;
  } finally {
    if (!useExternalConnection && connection) {
      connection.release();
    }
  }
};

// Update flat workflow and cascade progress updates
const updateFlatWorkflow = async (flatId, workflow) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Validate workflow structure
    if (!Array.isArray(workflow)) {
      throw new Error("Workflow must be an array");
    }

    // Calculate flat progress
    const { progress, status } = calculateWorkflowProgress(workflow);

    // Update flat
    await connection.execute(
      `UPDATE flats 
       SET workflow = ?, progress_percentage = ?, status = ?
       WHERE id = ?`,
      [JSON.stringify(workflow), progress, status, flatId]
    );

    // Get floor ID
    const [flatRows] = await connection.execute(
      "SELECT floor_id FROM flats WHERE id = ?",
      [flatId]
    );

    let buildingId = null;
    let projectId = null;

    if (flatRows.length > 0) {
      // Update floor progress and get buildingId
      buildingId = await updateFloorProgress(flatRows[0].floor_id, connection);

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
      flatId,
      buildingId,
      projectId,
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

// Update single task in flat workflow
const updateFlatTask = async (flatId, taskId, newStatus) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get current flat data
    const [flats] = await connection.execute(
      "SELECT workflow FROM flats WHERE id = ?",
      [flatId]
    );

    if (flats.length === 0) {
      throw new Error("Flat not found");
    }

    let workflow = flats[0].workflow;

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

    // Update flat
    await connection.execute(
      `UPDATE flats 
       SET workflow = ?, progress_percentage = ?, status = ?
       WHERE id = ?`,
      [JSON.stringify(updatedWorkflow), progress, status, flatId]
    );

    // Get floor ID for cascading
    const [flatRows] = await connection.execute(
      "SELECT floor_id FROM flats WHERE id = ?",
      [flatId]
    );

    let buildingId = null;
    let projectId = null;

    if (flatRows.length > 0) {
      // Update floor progress and get buildingId
      buildingId = await updateFloorProgress(flatRows[0].floor_id, connection);

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
      flatProgress: progress,
      flatStatus: status,
      buildingId,
      projectId,
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

// Get flat by ID
const getFlatById = async (flatId) => {
  try {
    const flats = await query("SELECT * FROM flats WHERE id = ?", [flatId]);

    if (flats.length === 0) {
      return null;
    }

    const flat = flats[0];

    // Parse workflow JSON if it's a string
    if (typeof flat.workflow === "string") {
      try {
        flat.workflow = JSON.parse(flat.workflow);
      } catch (error) {
        flat.workflow = [];
      }
    }

    return flat;
  } catch (error) {
    console.error("Error fetching flat:", error);
    throw error;
  }
};

// Get all flats for a floor
const getFlatsByFloor = async (floorId) => {
  try {
    const flats = await query(
      "SELECT * FROM flats WHERE floor_id = ? ORDER BY id",
      [floorId]
    );

    // Parse workflow JSON for each flat
    return flats.map((flat) => {
      if (typeof flat.workflow === "string") {
        try {
          flat.workflow = JSON.parse(flat.workflow);
        } catch (error) {
          flat.workflow = [];
        }
      }
      return flat;
    });
  } catch (error) {
    console.error("Error fetching flats by floor:", error);
    throw error;
  }
};

module.exports = {
  updateFlatWorkflow,
  updateFlatTask,
  getFlatById,
  getFlatsByFloor,
  updateFloorProgress,
  updateBuildingProgress,
  updateProjectProgress,
};
