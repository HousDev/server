// controllers/vendorController.js
const { pool } = require("../config/db");

/**
 * Helper to normalize pool.query return value.
 * mysql2/promise normally returns [rows, fields].
 * But be defensive in case something else is returned.
 */
function normalizeQueryResult(res) {
  if (Array.isArray(res)) {
    // [rows, fields] or [result]
    return {
      rows: res[0],
      meta: res[1] !== undefined ? res[1] : undefined,
      raw: res,
    };
  }
  // unexpected but handle gracefully
  return { rows: res, meta: undefined, raw: res };
}

/* GET /api/vendors?q=... */
exports.getVendors = async (req, res) => {
  const qRaw = req.query.q ? req.query.q.trim() : "";
  const q = `%${qRaw}%`;
  const sql = `
    SELECT * FROM vendors
    WHERE name LIKE ?
      OR category_name LIKE ?
      OR contact_person_name LIKE ?
      OR pan_number LIKE ?
      OR gst_number LIKE ?
    ORDER BY name ASC
  `;
  try {
    const queryRes = await pool.query(sql, [q, q, q, q, q]);
    const { rows } = normalizeQueryResult(queryRes);
    return res.json(rows || []);
  } catch (err) {
    console.error("getVendors error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getVendorById = async (req, res) => {
  try {
    const queryRes = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      req.params.id,
    ]);
    const { rows } = normalizeQueryResult(queryRes);
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Vendor not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("getVendorById error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createVendor = async (req, res) => {
  const d = req.body;
  console.log(d);
  if (
    !d.name ||
    !d.category_name ||
    !d.contact_person_name ||
    !d.contact_person_phone ||
    !d.contact_person_email
  ) {
    return res.status(400).json({
      message:
        "name, category_name, contact_person_name, contact_person_phone and contact_person_email are required",
    });
  }

  const query = `
    INSERT INTO vendors
      (name, category_name, pan_number, gst_number,
       contact_person_name, contact_person_phone, contact_person_email,
       office_street, office_city, office_state, office_pincode, office_country,
       company_email, company_phone,
       manager_name, manager_email, manager_phone,
       phone_country_code)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const values = [
    d.name,
    d.category_name,
    d.pan_number || null,
    d.gst_number || null,
    d.contact_person_name,
    d.contact_person_phone,
    d.contact_person_email,
    d.office_street || null,
    d.office_city || null,
    d.office_state || null,
    d.office_pincode || null,
    d.office_country || "India",
    d.company_email || null,
    d.company_phone || null,
    d.manager_name || null,
    d.manager_email || null,
    d.manager_phone || null,
    d.phone_country_code || "+91",
  ];

  try {
    let [existingOne] = await pool.query(
      "SELECT * FROM vendors where contact_person_phone = ? ",
      [d.contact_person_phone],
    );

    if (existingOne.length > 0) {
      return res
        .status(400)
        .json({ message: " Contact person phone number already exists." });
    }

    [existingOne] = await pool.query(
      "SELECT * FROM vendors where contact_person_email = ? ",
      [d.contact_person_email],
    );

    if (existingOne.length > 0) {
      return res
        .status(400)
        .json({ message: " Contact person email already exists." });
    }

    [existingOne] = await pool.query(
      "SELECT * FROM vendors where company_email = ? ",
      [d.company_email],
    );

    if (existingOne.length > 0) {
      return res.status(400).json({ message: "Company email already exists." });
    }

    [existingOne] = await pool.query(
      "SELECT * FROM vendors where company_phone = ? ",
      [d.company_phone],
    );

    if (existingOne.length > 0) {
      return res
        .status(400)
        .json({ message: "Company phone number already exists." });
    }

    const queryRes = await pool.query(query, values);
    const { rows, raw } = normalizeQueryResult(queryRes);

    // Insert result shape might be in rows (as result object) or raw[0]
    // mysql2/promise: query returns [result, fields] where result.insertId exists
    let insertId;
    if (
      Array.isArray(raw) &&
      raw[0] &&
      typeof raw[0].insertId !== "undefined"
    ) {
      insertId = raw[0].insertId;
    } else if (rows && typeof rows.insertId !== "undefined") {
      insertId = rows.insertId;
    } else if (queryRes && queryRes.insertId) {
      insertId = queryRes.insertId;
    }
    // OR contact_person_email = ? OR company_email = ? OR company_phone = ?

    if (!insertId) {
      // fallback: try to get affected rows / last insert id via SELECT (less ideal)
      console.warn(
        "createVendor: could not detect insertId from query result, attempting fallback SELECT",
      );
      // try selecting by unique combination (name + contact email) — only if provided
      const [maybeRows] = await pool.query(
        "SELECT * FROM vendors WHERE name = ? AND contact_person_email = ? ORDER BY id DESC LIMIT 1",
        [d.name, d.contact_person_email],
      );
      const norm = normalizeQueryResult(maybeRows);
      if (norm.rows && norm.rows.length > 0) {
        return res.status(201).json(norm.rows[0]);
      }
      return res.status(201).json({ message: "Vendor created" });
    }

    // fetch created row
    const selectRes = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      insertId,
    ]);

    const selectNorm = normalizeQueryResult(selectRes);

    return res
      .status(201)
      .json(selectNorm.rows ? selectNorm.rows[0] : { id: insertId });
  } catch (err) {
    console.error("createVendor error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateVendor = async (req, res) => {
  const id = req.params.id;
  const d = req.body;

  try {
    const [existsRows] = await pool.query(
      "SELECT id FROM vendors WHERE id = ?",
      [id],
    );
    // handle both shapes
    const exists = Array.isArray(existsRows) ? existsRows[0] : existsRows;
    if (!exists || (Array.isArray(exists) && exists.length === 0)) {
      // re-run normalized version
      const norm = normalizeQueryResult(existsRows);
      if (!norm.rows || norm.rows.length === 0) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    const query = `
      UPDATE vendors SET
        name = ?, category_name = ?, pan_number = ?, gst_number = ?,
        contact_person_name = ?, contact_person_phone = ?, contact_person_email = ?,
        office_street = ?, office_city = ?, office_state = ?, office_pincode = ?, office_country = ?,
        company_email = ?, company_phone = ?,
        manager_name = ?, manager_email = ?, manager_phone = ?, phone_country_code = ?
      WHERE id = ?
    `;
    const values = [
      d.name,
      d.category_name,
      d.pan_number || null,
      d.gst_number || null,
      d.contact_person_name,
      d.contact_person_phone,
      d.contact_person_email,
      d.office_street || null,
      d.office_city || null,
      d.office_state || null,
      d.office_pincode || null,
      d.office_country || "India",
      d.company_email || null,
      d.company_phone || null,
      d.manager_name || null,
      d.manager_email || null,
      d.manager_phone || null,
      d.phone_country_code || "+91",
      id,
    ];

    await pool.query(query, values);
    const selectRes = await pool.query("SELECT * FROM vendors WHERE id = ?", [
      id,
    ]);
    const selectNorm = normalizeQueryResult(selectRes);
    return res.json(selectNorm.rows ? selectNorm.rows[0] : { id });
  } catch (err) {
    console.error("updateVendor error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    await pool.query("DELETE FROM vendors WHERE id = ?", [req.params.id]);
    return res.json({ message: "Vendor deleted" });
  } catch (err) {
    console.error("deleteVendor error", err);
    return res.status(500).json({ message: "Server error" });
  }
};
