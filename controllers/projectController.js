// controllers/projectController.js
const { pool } = require("../config/db");

/**
 * GET /api/projects
 * Supports optional query params:
 *  - q=search (search by name/location/description)
 *  - active=1|0 (filter active)
 *  - limit, offset
 */
async function getProjects(req, res) {
  try {
    const q = req.query.q ? String(req.query.q).trim() : null;
    const active =
      typeof req.query.active !== "undefined" ? req.query.active : null;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    let sql = `SELECT * FROM projects`;
    const params = [];

    const where = [];
    if (q) {
      where.push(`(name LIKE ? OR location LIKE ? OR description LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (active !== null) {
      where.push(`is_active = ?`);
      params.push(active == "1" ? 1 : 0);
    }

    if (where.length) sql += ` WHERE ` + where.join(" AND ");

    sql += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("getProjects error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

async function getProjectById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const [rows] = await pool.query(
      `SELECT * FROM projects WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("getProjectById error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

async function createProject(req, res) {
  try {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const payload = {
      name: String(body.name).trim(),
      description: body.description || null,
      location: body.location || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status || "active",
      is_active: body.is_active === false ? 0 : 1,
      created_by: Number(body.created_by) || null,
    };

    const sql = `INSERT INTO projects
      (name, description, location, start_date, end_date, status, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      payload.name,
      payload.description,
      payload.location,
      payload.start_date,
      payload.end_date,
      payload.status,
      payload.is_active,
      payload.created_by,
    ];

    const [result] = await pool.query(sql, params);
    const newId = result.insertId;
    const [newRow] = await pool.query(
      `SELECT * FROM projects WHERE id = ? LIMIT 1`,
      [newId]
    );
    return res.status(201).json(newRow[0]);
  } catch (err) {
    console.error("createProject error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

/**
 * Partial update allowed via PATCH or full replace via PUT.
 * We'll accept JSON body and update only provided fields.
 */
async function updateProject(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const body = req.body || {};
    const allowed = [
      "name",
      "description",
      "location",
      "start_date",
      "end_date",
      "status",
      "is_active",
    ];
    const fields = [];
    const params = [];

    allowed.forEach((k) => {
      if (typeof body[k] !== "undefined") {
        fields.push(`${k} = ?`);
        if (k === "is_active") params.push(body[k] ? 1 : 0);
        else params.push(body[k] === "" ? null : body[k]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: "no updatable fields provided" });
    }

    const sql = `UPDATE projects SET ${fields.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "not found" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM projects WHERE id = ? LIMIT 1`,
      [id]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error("updateProject error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

async function deleteProject(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const [result] = await pool.query(`DELETE FROM projects WHERE id = ?`, [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteProject error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
