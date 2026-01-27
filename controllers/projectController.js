const projectModel = require("../models/projectModel");

// Create project with full hierarchy
const createProject = async (req, res) => {
  try {
    const projectData = req.body;
    // console.log(JSON.stringify(projectData));
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
    console.log(project);
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
  getAllProjects,
  updateProjectHierarchy,
  deleteProject,
};

// controllers/projectController.js
// const { pool } = require("../config/db");

/**
 * GET /api/projects
 * Supports optional query params:
 *  - q=search (search by name/location/description)
 *  - active=1|0 (filter active)
 *  - limit, offset
 */
// async function getProjects(req, res) {
//   try {
//     const q = req.query.q ? String(req.query.q).trim() : null;
//     const active =
//       typeof req.query.active !== "undefined" ? req.query.active : null;
//     const limit = parseInt(req.query.limit, 10) || 100;
//     const offset = parseInt(req.query.offset, 10) || 0;

//     let sql = `SELECT * FROM projects`;
//     const params = [];

//     const where = [];
//     if (q) {
//       where.push(`(name LIKE ? OR location LIKE ? OR description LIKE ?)`);
//       params.push(`%${q}%`, `%${q}%`, `%${q}%`);
//     }
//     if (active !== null) {
//       where.push(`is_active = ?`);
//       params.push(active == "1" ? 1 : 0);
//     }

//     if (where.length) sql += ` WHERE ` + where.join(" AND ");

//     sql += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
//     params.push(limit, offset);

//     const [rows] = await pool.query(sql, params);
//     return res.json(rows);
//   } catch (err) {
//     console.error("getProjects error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// async function getProjectById(req, res) {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (!id) return res.status(400).json({ error: "invalid id" });

//     const [rows] = await pool.query(
//       `SELECT * FROM projects WHERE id = ? LIMIT 1`,
//       [id]
//     );
//     if (rows.length === 0) return res.status(404).json({ error: "not found" });
//     return res.json(rows[0]);
//   } catch (err) {
//     console.error("getProjectById error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// async function createProject(req, res) {
//   try {
//     const body = req.body || {};
//     if (!body.name || !String(body.name).trim()) {
//       return res.status(400).json({ error: "name is required" });
//     }

//     const payload = {
//       name: String(body.name).trim(),
//       description: body.description || null,
//       location: body.location || null,
//       start_date: body.start_date || null,
//       end_date: body.end_date || null,
//       status: body.status || "active",
//       is_active: body.is_active === false ? 0 : 1,
//       created_by: Number(body.created_by) || null,
//     };

//     const sql = `INSERT INTO projects
//       (name, description, location, start_date, end_date, status, is_active, created_by)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
//     const params = [
//       payload.name,
//       payload.description,
//       payload.location,
//       payload.start_date,
//       payload.end_date,
//       payload.status,
//       payload.is_active,
//       payload.created_by,
//     ];

//     const [result] = await pool.query(sql, params);
//     const newId = result.insertId;
//     const [newRow] = await pool.query(
//       `SELECT * FROM projects WHERE id = ? LIMIT 1`,
//       [newId]
//     );
//     return res.status(201).json(newRow[0]);
//   } catch (err) {
//     console.error("createProject error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// /**
//  * Partial update allowed via PATCH or full replace via PUT.
//  * We'll accept JSON body and update only provided fields.
//  */
// async function updateProject(req, res) {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (!id) return res.status(400).json({ error: "invalid id" });

//     const body = req.body || {};
//     const allowed = [
//       "name",
//       "description",
//       "location",
//       "start_date",
//       "end_date",
//       "status",
//       "is_active",
//     ];
//     const fields = [];
//     const params = [];

//     allowed.forEach((k) => {
//       if (typeof body[k] !== "undefined") {
//         fields.push(`${k} = ?`);
//         if (k === "is_active") params.push(body[k] ? 1 : 0);
//         else params.push(body[k] === "" ? null : body[k]);
//       }
//     });

//     if (fields.length === 0) {
//       return res.status(400).json({ error: "no updatable fields provided" });
//     }

//     const sql = `UPDATE projects SET ${fields.join(
//       ", "
//     )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
//     params.push(id);

//     const [result] = await pool.query(sql, params);
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "not found" });
//     }

//     const [rows] = await pool.query(
//       `SELECT * FROM projects WHERE id = ? LIMIT 1`,
//       [id]
//     );
//     return res.json(rows[0]);
//   } catch (err) {
//     console.error("updateProject error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// async function deleteProject(req, res) {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (!id) return res.status(400).json({ error: "invalid id" });

//     const [result] = await pool.query(`DELETE FROM projects WHERE id = ?`, [
//       id,
//     ]);
//     if (result.affectedRows === 0)
//       return res.status(404).json({ error: "not found" });
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error("deleteProject error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// module.exports = {
//   getProjects,
//   getProjectById,
//   createProject,
//   updateProject,
//   deleteProject,
// };
