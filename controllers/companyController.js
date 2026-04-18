const { pool } = require("../config/db");

function normalizeQueryResult(res) {
  if (Array.isArray(res)) {
    return {
      rows: res[0],
      meta: res[1],
      raw: res,
    };
  }
  return { rows: res, meta: undefined, raw: res };
}

// GET /api/companies
exports.getCompanies = async (req, res) => {
  try {
    const sql = `
      SELECT * FROM companies 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `;
    const queryRes = await pool.query(sql);
    const { rows } = normalizeQueryResult(queryRes);
    return res.json(rows || []);
  } catch (err) {
    console.error("getCompanies error", err);
    return res.status(500).json({ message: "Server error fetching companies" });
  }
};

// GET /api/companies/:id
exports.getCompanyById = async (req, res) => {
  try {
    const queryRes = await pool.query(
      "SELECT * FROM companies WHERE id = ? AND is_active = 1",
      [req.params.id],
    );
    const { rows } = normalizeQueryResult(queryRes);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("getCompanyById error", err);
    return res.status(500).json({ message: "Server error fetching company" });
  }
};

// POST /api/companies
exports.createCompany = async (req, res) => {
  const {
    name,
    code,
    email,
    phone,
    address,
    city,
    state,
    country,
    latitude,
    longitude,
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "Company name and code are required",
    });
  }

  const sql = `
    INSERT INTO companies 
      (name, code, email, phone, address, city, state, country, 
       latitude, longitude, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const values = [
    name,
    code,
    email || null,
    phone || null,
    address || null,
    city || null,
    state || null,
    country || null,
    latitude || 0,
    longitude || 0,
  ];

  try {
    const queryRes = await pool.query(sql, values);
    const { raw } = normalizeQueryResult(queryRes);

    let insertId;
    if (Array.isArray(raw) && raw[0] && raw[0].insertId) {
      insertId = raw[0].insertId;
    }

    if (!insertId) {
      const [created] = await pool.query(
        "SELECT * FROM companies WHERE name = ? AND code = ? ORDER BY id DESC LIMIT 1",
        [name, code],
      );
      const norm = normalizeQueryResult(created);
      if (norm.rows && norm.rows.length > 0) {
        return res.status(201).json(norm.rows[0]);
      }
      return res.status(201).json({ message: "Company created successfully" });
    }

    const selectRes = await pool.query("SELECT * FROM companies WHERE id = ?", [
      insertId,
    ]);
    const selectNorm = normalizeQueryResult(selectRes);
    return res
      .status(201)
      .json(selectNorm.rows ? selectNorm.rows[0] : { id: insertId });
  } catch (err) {
    console.error("createCompany error", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Company with this code already exists" });
    }

    return res.status(500).json({ message: "Server error creating company" });
  }
};

// PUT /api/companies/:id
exports.updateCompany = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    email,
    phone,
    address,
    city,
    state,
    country,
    latitude,
    longitude,
    is_active,
  } = req.body;

  try {
    const [exists] = await pool.query("SELECT id FROM companies WHERE id = ?", [
      id,
    ]);
    if (!exists || exists.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const sql = `
      UPDATE companies SET
        name = ?, code = ?, email = ?, phone = ?, address = ?,
        city = ?, state = ?, country = ?, latitude = ?, longitude = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      name,
      code,
      email || null,
      phone || null,
      address || null,
      city || null,
      state || null,
      country || null,
      latitude || 0,
      longitude || 0,
      is_active !== undefined ? is_active : 1,
      id,
    ];

    await pool.query(sql, values);

    const [updated] = await pool.query("SELECT * FROM companies WHERE id = ?", [
      id,
    ]);
    return res.json(updated[0]);
  } catch (err) {
    console.error("updateCompany error", err);
    return res.status(500).json({ message: "Server error updating company" });
  }
};

// DELETE /api/companies/:id (soft delete)
exports.deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const [exists] = await pool.query("SELECT id FROM companies WHERE id = ?", [
      id,
    ]);
    if (!exists || exists.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Soft delete - set is_active = 0
    await pool.query(
      "UPDATE companies SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );

    return res.json({ message: "Company deleted successfully" });
  } catch (err) {
    console.error("deleteCompany error", err);
    return res.status(500).json({ message: "Server error deleting company" });
  }
};

// GET /api/companies/:id/locations
// GET /api/companies/:id/locations
exports.getCompanyLocations = async (req, res) => {
  const { id } = req.params;

  try {
    // Remove the "AND is_active = 1" filter to get ALL branches
    const sql = `
      SELECT * FROM office_locations 
      WHERE company_id = ? 
      ORDER BY 
        is_active DESC,  -- Show active first
        created_at DESC
    `;
    const [locations] = await pool.query(sql, [id]);
    return res.json(locations || []);
  } catch (err) {
    console.error("getCompanyLocations error", err);
    return res.status(500).json({ message: "Server error fetching locations" });
  }
};

exports.getCompanyLocationById = async (req, res) => {
  const { id } = req.params;

  try {
    // Remove the "AND is_active = 1" filter to get ALL branches
    const sql = `
      SELECT * FROM office_locations 
      WHERE id = ?
    `;
    const [rows] = await pool.query(sql, [id]);

    return res.json(rows || []);
  } catch (err) {
    console.error("getCompanyLocations error", err);
    return res.status(500).json({ message: "Server error fetching locations" });
  }
};

// POST /api/companies/:id/locations
exports.createOfficeLocation = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
    geofence_radius_meters = 1000,
    contact_email,
    contact_phone,
  } = req.body;

  if (!name || !address) {
    return res.status(400).json({
      message: "Office name and address are required",
    });
  }

  // Check if company exists
  try {
    const [company] = await pool.query(
      "SELECT id FROM companies WHERE id = ? AND is_active = 1",
      [id],
    );

    if (!company || company.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const sql = `
      INSERT INTO office_locations 
        (company_id, name, address, city, state, country, pincode,
         latitude, longitude, geofence_radius_meters, 
         contact_email, contact_phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const values = [
      id,
      name,
      address,
      city || null,
      state || null,
      country || null,
      pincode || null,
      latitude || 0,
      longitude || 0,
      geofence_radius_meters,
      contact_email || null,
      contact_phone || null,
    ];

    const queryRes = await pool.query(sql, values);
    const { raw } = normalizeQueryResult(queryRes);

    let insertId;
    if (Array.isArray(raw) && raw[0] && raw[0].insertId) {
      insertId = raw[0].insertId;
    }

    if (!insertId) {
      const [created] = await pool.query(
        "SELECT * FROM office_locations WHERE company_id = ? AND name = ? ORDER BY id DESC LIMIT 1",
        [id, name],
      );
      const norm = normalizeQueryResult(created);
      if (norm.rows && norm.rows.length > 0) {
        return res.status(201).json(norm.rows[0]);
      }
      return res
        .status(201)
        .json({ message: "Office location created successfully" });
    }

    const selectRes = await pool.query(
      "SELECT * FROM office_locations WHERE id = ?",
      [insertId],
    );
    const selectNorm = normalizeQueryResult(selectRes);
    return res
      .status(201)
      .json(selectNorm.rows ? selectNorm.rows[0] : { id: insertId });
  } catch (err) {
    console.error("createOfficeLocation error", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message:
          "Office location with this name already exists for this company",
      });
    }

    return res
      .status(500)
      .json({ message: "Server error creating office location" });
  }
};

// PUT /api/companies/locations/:id
// PUT /api/companies/locations/:id
exports.updateOfficeLocation = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
    geofence_radius_meters,
    contact_email,
    contact_phone,
    is_active, // Make sure this is included
  } = req.body;

  try {
    const [exists] = await pool.query(
      "SELECT id FROM office_locations WHERE id = ?",
      [id],
    );
    if (!exists || exists.length === 0) {
      return res.status(404).json({ message: "Office location not found" });
    }

    const sql = `
      UPDATE office_locations SET
        name = ?, address = ?, city = ?, state = ?, country = ?,
        pincode = ?, latitude = ?, longitude = ?, geofence_radius_meters = ?,
        contact_email = ?, contact_phone = ?, is_active = ?, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      name,
      address,
      city || null,
      state || null,
      country || null,
      pincode || null,
      latitude || 0,
      longitude || 0,
      geofence_radius_meters || 1000,
      contact_email || null,
      contact_phone || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1, // Handle boolean conversion
      id,
    ];

    await pool.query(sql, values);

    const [updated] = await pool.query(
      "SELECT * FROM office_locations WHERE id = ?",
      [id],
    );
    return res.json(updated[0]);
  } catch (err) {
    console.error("updateOfficeLocation error", err);
    return res
      .status(500)
      .json({ message: "Server error updating office location" });
  }
};

// DELETE /api/companies/locations/:id
// DELETE /api/companies/locations/:id
// DELETE /api/companies/locations/:id - HARD DELETE
exports.deleteOfficeLocation = async (req, res) => {
  const { id } = req.params;

  try {
    const [exists] = await pool.query(
      "SELECT id FROM office_locations WHERE id = ?",
      [id],
    );
    if (!exists || exists.length === 0) {
      return res.status(404).json({ message: "Office location not found" });
    }

    // HARD DELETE - permanently remove from database
    await pool.query("DELETE FROM office_locations WHERE id = ?", [id]);

    return res.json({ message: "Office location deleted permanently" });
  } catch (err) {
    console.error("deleteOfficeLocation error", err);
    return res
      .status(500)
      .json({ message: "Server error deleting office location" });
  }
};
