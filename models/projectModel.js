const { pool, query } = require("../config/db");

// Helper: Validate project data
const validateProjectData = (projectData) => {
  if (!projectData.name || !projectData.name.trim()) {
    throw new Error("Project name is required");
  }
  if (!projectData.location || !projectData.location.trim()) {
    throw new Error("Project location is required");
  }
};

// Create project with full hierarchy (Project -> Buildings -> Floors -> Flats/Common Areas)
const createProjectWithHierarchy = async (projectData) => {
  validateProjectData(projectData);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Create project
    const [projectResult] = await connection.execute(
      `INSERT INTO projects (name, location, start_date, end_date) 
       VALUES (?, ?, ?, ?)`,
      [
        projectData.name,
        projectData.location,
        projectData.start_date || null,
        projectData.end_date || null,
      ],
    );

    const projectId = projectResult.insertId;
    //for error
    // 2. Create buildings
    if (projectData.buildings && projectData.buildings.length > 0) {
      for (const building of projectData.buildings) {
        if (!building.building_name || !building.building_name.trim()) {
          throw new Error("Building name is required");
        }

        const [buildingResult] = await connection.execute(
          `INSERT INTO buildings (project_id, building_name) 
           VALUES (?, ?)`,
          [projectId, building.building_name],
        );

        const buildingId = buildingResult.insertId;

        // 3. Create floors for this building
        if (building.floors && building.floors.length > 0) {
          for (const floor of building.floors) {
            if (!floor.floor_name || !floor.floor_name.trim()) {
              throw new Error("Floor name is required");
            }

            const [floorResult] = await connection.execute(
              `INSERT INTO floors (building_id, floor_name) 
               VALUES (?, ?)`,
              [buildingId, floor.floor_name],
            );

            const floorId = floorResult.insertId;

            // 4. Create flats for this floor
            if (floor.flats && floor.flats.length > 0) {
              for (const flat of floor.flats) {
                if (!flat.flat_name || !flat.flat_name.trim()) {
                  throw new Error("Flat name is required");
                }

                const [flatResult] = await connection.execute(
                  `INSERT INTO flats (floor_id, flat_name) 
                   VALUES (?, ?)`,
                  [floorId, flat.flat_name],
                );

                const flatId = flatResult.insertId;
                if (flat.areas && flat.areas.length > 0) {
                  for (const area of flat.areas) {
                    if (!area.name || !area.name.trim()) {
                      throw new Error("Flat name is required");
                    }

                    await connection.execute(
                      `INSERT INTO area_component (name,area_type,area_id, area_size,unit) 
                   VALUES (?, ?, ?, ?, ?)`,
                      [
                        area.name,
                        area.area_type,
                        flatId,
                        area.area_size,
                        area.unit,
                      ],
                    );
                  }
                }
              }
            }

            // 5. Create common areas for this floor
            if (floor.common_areas && floor.common_areas.length > 0) {
              for (const commonArea of floor.common_areas) {
                if (
                  !commonArea.common_area_name ||
                  !commonArea.common_area_name.trim()
                ) {
                  throw new Error("Common area name is required");
                }

                await connection.execute(
                  `INSERT INTO common_areas (floor_id, common_area_name,area_size,unit) 
                   VALUES (?, ?, ?, ?)`,
                  [
                    floorId,
                    commonArea.common_area_name,
                    commonArea.area_size,
                    commonArea.unit,
                  ],
                );
              }
            }
          }
        }
      }
    }

    await connection.commit();
    connection.release();

    // Get the created project with hierarchy
    const createdProject = await getProjectHierarchy(projectId);

    return {
      success: true,
      projectId,
      data: createdProject,
      message: "Project created successfully with full hierarchy",
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

const getProjectHierarchy = async (projectId) => {
  try {
    // 1️⃣ Get project
    const [projects] = await query("SELECT * FROM projects WHERE id = ?", [
      projectId,
    ]);

    if (!projects) return null;

    const project = projects;

    // 2️⃣ Fetch hierarchy
    const rows = await query(
      `
      SELECT 
        b.id AS building_id,
        b.building_name,
        b.status AS building_status,
        b.progress_percentage AS building_progress,

        f.id AS floor_id,
        f.floor_name,
        f.status AS floor_status,
        f.progress_percentage AS floor_progress,

        fl.id AS flat_id,
        fl.flat_name,
        fl.status AS flat_status,
        fl.workflow AS flat_workflow,
        fl.progress_percentage AS flat_progress,

        ca.id AS common_area_id,
        ca.common_area_name,
        ca.status AS common_area_status,
        ca.workflow AS common_area_workflow,
        ca.progress_percentage AS common_area_progress,
        ca.area_size AS common_area_size,
        ca.unit AS common_area_size_unit,

        ac.id AS area_component_id,
        ac.name AS area_component_name,
        ac.area_id AS area_id,
        ac.area_size AS area_component_size,
        ac.unit AS area_component_size_unit,
        ac.status AS area_component_status

      FROM buildings b
      LEFT JOIN floors f ON b.id = f.building_id
      LEFT JOIN flats fl ON f.id = fl.floor_id
      LEFT JOIN common_areas ca ON f.id = ca.floor_id
      LEFT JOIN area_component ac 
        ON fl.id = ac.area_id AND ac.area_type = 'flat'
      WHERE b.project_id = ?
      ORDER BY b.id, f.id, fl.id, ca.id
      `,
      [projectId],
    );

    // 3️⃣ Build hierarchy
    const buildingsMap = new Map();

    rows.forEach((row) => {
      // 🏢 Building
      if (!buildingsMap.has(row.building_id)) {
        buildingsMap.set(row.building_id, {
          id: row.building_id,
          project_id: projectId,
          building_name: row.building_name,
          status: row.building_status,
          progress_percentage: row.building_progress,
          floors: new Map(),
        });
      }

      const building = buildingsMap.get(row.building_id);

      // 🏬 Floor
      if (row.floor_id && !building.floors.has(row.floor_id)) {
        building.floors.set(row.floor_id, {
          id: row.floor_id,
          building_id: row.building_id,
          floor_name: row.floor_name,
          status: row.floor_status,
          progress_percentage: row.floor_progress,
          flats: [],
          common_areas: [],
        });
      }

      if (!row.floor_id) return;

      const floor = building.floors.get(row.floor_id);

      // 🏠 Flat
      if (row.flat_id && !floor.flats.some((f) => f.id === row.flat_id)) {
        let workflow = row.flat_workflow;
        if (typeof workflow === "string") {
          try {
            workflow = JSON.parse(workflow);
          } catch {
            workflow = [];
          }
        }

        floor.flats.push({
          id: row.flat_id,
          floor_id: row.floor_id,
          flat_name: row.flat_name,
          status: row.flat_status,
          workflow,
          progress_percentage: row.flat_progress,
          areas: [], // 👈 important
        });
      }

      // 📐 Area Components (Flat Areas)
      if (row.area_component_id && row.flat_id) {
        const flat = floor.flats.find((f) => f.id === row.flat_id);

        if (flat && !flat.areas.some((a) => a.id === row.area_component_id)) {
          flat.areas.push({
            id: row.area_component_id,
            name: row.area_component_name,
            area_id: row.area_id,
            area_size: row.area_component_size,
            unit: row.area_component_size_unit,
            status: row.area_component_status,
          });
        }
      }

      // 🏢 Common Areas
      if (
        row.common_area_id &&
        !floor.common_areas.some((ca) => ca.id === row.common_area_id)
      ) {
        let workflow = row.common_area_workflow;
        if (typeof workflow === "string") {
          try {
            workflow = JSON.parse(workflow);
          } catch {
            workflow = [];
          }
        }

        floor.common_areas.push({
          id: row.common_area_id,
          floor_id: row.floor_id,
          common_area_name: row.common_area_name,
          common_area_size: row.common_area_size,
          common_area_size_unit: row.common_area_size_unit,
          status: row.common_area_status,
          workflow,
          progress_percentage: row.common_area_progress,
        });
      }
    });

    // 4️⃣ Convert maps → arrays
    project.buildings = Array.from(buildingsMap.values()).map((building) => ({
      ...building,
      floors: Array.from(building.floors.values()),
    }));

    return project;
  } catch (error) {
    console.error("Error fetching project hierarchy:", error);
    throw error;
  }
};

// Get all projects
const getAllProjects = async () => {
  try {
    const projects = await query(
      "SELECT * FROM projects ORDER BY created_at DESC",
    );
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Comprehensive project update with hierarchy
const updateProjectWithHierarchy = async (projectId, projectData) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update project basic info if provided
    if (
      projectData.name !== undefined ||
      projectData.location !== undefined ||
      projectData.start_date !== undefined ||
      projectData.end_date !== undefined
    ) {
      // Validate non-empty name if provided
      if (projectData.name !== undefined && !projectData.name.trim()) {
        throw new Error("Project name cannot be empty");
      }

      // Validate non-empty location if provided
      if (projectData.location !== undefined && !projectData.location.trim()) {
        throw new Error("Project location cannot be empty");
      }

      await connection.execute(
        `UPDATE projects 
         SET name = COALESCE(?, name),
             location = COALESCE(?, location),
             start_date = ?,
             end_date = ?
         WHERE id = ?`,
        [
          projectData.name,
          projectData.location,
          projectData.start_date || null,
          projectData.end_date || null,
          projectId,
        ],
      );
    }

    // 2. Handle buildings updates (if buildings array is provided)
    if (projectData.buildings !== undefined) {
      // Get existing buildings for this project
      const [existingBuildings] = await connection.execute(
        "SELECT id, building_name FROM buildings WHERE project_id = ?",
        [projectId],
      );

      const existingBuildingMap = new Map(
        existingBuildings.map((b) => [b.id, b]),
      );
      const incomingBuildingMap = new Map();

      // Process each building in the update data
      for (const building of projectData.buildings) {
        if (!building.building_name || !building.building_name.trim()) {
          throw new Error("Building name is required");
        }

        if (building.id) {
          // Update existing building
          incomingBuildingMap.set(building.id, building);

          await connection.execute(
            `UPDATE buildings 
             SET building_name = ?
             WHERE id = ? AND project_id = ?`,
            [building.building_name, building.id, projectId],
          );
        } else {
          // Create new building
          const [buildingResult] = await connection.execute(
            `INSERT INTO buildings (project_id, building_name) 
             VALUES (?, ?)`,
            [projectId, building.building_name],
          );

          // Store new ID for floor processing
          building.newId = buildingResult.insertId;
        }

        // 3. Handle floors updates for this building (if floors array is provided)
        if (building.floors !== undefined) {
          const buildingDbId = building.id || building.newId;

          // Get existing floors for this building
          const [existingFloors] = await connection.execute(
            "SELECT id, floor_name FROM floors WHERE building_id = ?",
            [buildingDbId],
          );

          const existingFloorMap = new Map(
            existingFloors.map((f) => [f.id, f]),
          );

          // Process each floor
          for (const floor of building.floors) {
            if (!floor.floor_name || !floor.floor_name.trim()) {
              throw new Error("Floor name is required");
            }

            if (floor.id) {
              // Update existing floor
              await connection.execute(
                `UPDATE floors 
                 SET floor_name = ?
                 WHERE id = ? AND building_id = ?`,
                [floor.floor_name, floor.id, buildingDbId],
              );

              existingFloorMap.delete(floor.id);
            } else {
              // Create new floor
              const [floorResult] = await connection.execute(
                `INSERT INTO floors (building_id, floor_name) 
                 VALUES (?, ?)`,
                [buildingDbId, floor.floor_name],
              );

              // Store new ID for flats/common areas processing
              floor.newId = floorResult.insertId;
            }

            // 4. Handle flats updates for this floor (if flats array is provided)
            if (floor.flats !== undefined) {
              const floorDbId = floor.id || floor.newId;

              // Get existing flats for this floor
              const [existingFlats] = await connection.execute(
                "SELECT id, flat_name FROM flats WHERE floor_id = ?",
                [floorDbId],
              );

              const existingFlatMap = new Map(
                existingFlats.map((f) => [f.id, f]),
              );

              // Process each flat
              for (const flat of floor.flats) {
                if (!flat.flat_name || !flat.flat_name.trim()) {
                  throw new Error("Flat name is required");
                }

                if (flat.id) {
                  // Update existing flat
                  await connection.execute(
                    `UPDATE flats 
                     SET flat_name = ?
                     WHERE id = ? AND floor_id = ?`,
                    [flat.flat_name, flat.id, floorDbId],
                  );

                  existingFlatMap.delete(flat.id);
                } else {
                  // Create new flat
                  await connection.execute(
                    `INSERT INTO flats (floor_id, flat_name) 
                     VALUES (?, ?)`,
                    [floorDbId, flat.flat_name],
                  );
                }
              }

              // Delete removed flats (only if flats array was provided)
              for (const [flatId, flat] of existingFlatMap) {
                await connection.execute("DELETE FROM flats WHERE id = ?", [
                  flatId,
                ]);
              }
            }

            // 5. Handle common areas updates for this floor (if common_areas array is provided)
            if (floor.common_areas !== undefined) {
              const floorDbId = floor.id || floor.newId;

              // Get existing common areas for this floor
              const [existingCommonAreas] = await connection.execute(
                "SELECT id, common_area_name FROM common_areas WHERE floor_id = ?",
                [floorDbId],
              );

              const existingCommonAreaMap = new Map(
                existingCommonAreas.map((ca) => [ca.id, ca]),
              );

              // Process each common area
              for (const commonArea of floor.common_areas) {
                if (
                  !commonArea.common_area_name ||
                  !commonArea.common_area_name.trim()
                ) {
                  throw new Error("Common area name is required");
                }

                if (commonArea.id) {
                  // Update existing common area
                  await connection.execute(
                    `UPDATE common_areas 
                     SET common_area_name = ?
                     WHERE id = ? AND floor_id = ?`,
                    [commonArea.common_area_name, commonArea.id, floorDbId],
                  );

                  existingCommonAreaMap.delete(commonArea.id);
                } else {
                  // Create new common area
                  await connection.execute(
                    `INSERT INTO common_areas (floor_id, common_area_name) 
                     VALUES (?, ?)`,
                    [floorDbId, commonArea.common_area_name],
                  );
                }
              }

              // Delete removed common areas (only if common_areas array was provided)
              for (const [commonAreaId, commonArea] of existingCommonAreaMap) {
                await connection.execute(
                  "DELETE FROM common_areas WHERE id = ?",
                  [commonAreaId],
                );
              }
            }
          }

          // Delete removed floors (only if floors array was provided)
          for (const [floorId, floor] of existingFloorMap) {
            await connection.execute("DELETE FROM floors WHERE id = ?", [
              floorId,
            ]);
          }
        }
      }

      // Delete removed buildings (only if buildings array was provided)
      for (const [buildingId, building] of existingBuildingMap) {
        if (!incomingBuildingMap.has(buildingId)) {
          await connection.execute("DELETE FROM buildings WHERE id = ?", [
            buildingId,
          ]);
        }
      }
    }

    await connection.commit();
    connection.release();

    // Get the updated project with hierarchy
    const updatedProject = await getProjectHierarchy(projectId);

    return {
      success: true,
      projectId,
      data: updatedProject,
      message: "Project updated successfully with full hierarchy",
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
};

// Delete project (will cascade delete all related records)
const deleteProject = async (projectId) => {
  try {
    const result = await query("DELETE FROM projects WHERE id = ?", [
      projectId,
    ]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

module.exports = {
  createProjectWithHierarchy,
  getProjectHierarchy,
  getAllProjects,
  updateProjectWithHierarchy,
  deleteProject,
};

// // models/projectModel.js
// const { pool } = require("../config/db");

// async function initProjectTable() {
//   const sql = `
//     CREATE TABLE IF NOT EXISTS projects (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(255) NOT NULL,
//       description TEXT NULL,
//       location VARCHAR(255) NULL,
//       start_date DATE NULL,
//       end_date DATE NULL,
//       status VARCHAR(50) DEFAULT 'active',
//       is_active TINYINT(1) DEFAULT 1,
//       created_by INT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
//   `;

//   const conn = await pool.getConnection();
//   try {
//     await conn.query(sql);
//   } catch (err) {
//     console.error("initProjectTable error", err);
//     throw err;
//   } finally {
//     conn.release();
//   }
// }

// module.exports = { initProjectTable };
