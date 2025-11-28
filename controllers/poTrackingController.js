// // controllers/poTrackingController.js
// const { pool } = require("../config/db");

// /**
//  * createTrackingRecords(records)
//  * - records: array of objects:
//  *   { po_id, item_id, item_description, quantity_ordered, quantity_received, quantity_pending, status }
//  * - returns { inserted: <number> }
//  *
//  * Usage (internal): await createTrackingRecords(records);
//  */
// async function createTrackingRecords(records) {
//   if (!Array.isArray(records) || records.length === 0) {
//     return { inserted: 0 };
//   }

//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     const cols = [
//       "po_id",
//       "item_id",
//       "item_description",
//       "quantity_ordered",
//       "quantity_received",
//       "quantity_pending",
//       "status",
//     ];

//     // Build array-of-arrays for bulk insert
//     const values = records.map((r) => [
//       r.po_id,
//       r.item_id ?? null,
//       r.item_description ?? null,
//       parseFloat(r.quantity_ordered || 0),
//       parseFloat(r.quantity_received || 0),
//       parseFloat(r.quantity_pending || 0),
//       r.status ?? "pending",
//     ]);

//     // mysql2 bulk insert requires VALUES ?
//     const sql = `INSERT INTO po_material_tracking (${cols.join(
//       ", "
//     )}) VALUES ?`;
//     await conn.query(sql, [values]);

//     await conn.commit();
//     return { inserted: values.length };
//   } catch (err) {
//     await conn.rollback();
//     console.error("poTracking.createTrackingRecords error", err);
//     throw err;
//   } finally {
//     conn.release();
//   }
// }

// /**
//  * Express route handler: POST /po-material-tracking or similar
//  * Expects body: { records: [...] }
//  */
// async function createTrackingHandler(req, res) {
//   const { records } = req.body;
//   if (!Array.isArray(records) || records.length === 0) {
//     return res.status(400).json({ error: "records array is required" });
//   }

//   try {
//     const result = await createTrackingRecords(records);
//     return res.status(201).json(result);
//   } catch (err) {
//     console.error("createTrackingHandler error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// /**
//  * Optional: GET listing for debugging (not required, but handy)
//  * GET /po-material-tracking?po_id=123
//  */
// async function listTrackingHandler(req, res) {
//   try {
//     const poId = req.query.po_id;
//     let sql = `SELECT * FROM po_material_tracking`;
//     const params = [];
//     if (poId) {
//       sql += ` WHERE po_id = ?`;
//       params.push(poId);
//     }
//     sql += ` ORDER BY created_at DESC LIMIT 1000`;
//     const [rows] = await pool.query(sql, params);
//     return res.json(rows);
//   } catch (err) {
//     console.error("listTrackingHandler error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// module.exports = {
//   createTrackingRecords, // internal function (preferred name)
//   createTracking: createTrackingRecords, // alias if other code calls createTracking
//   createTrackingHandler, // express route handler (POST)
//   listTrackingHandler, // optional GET handler for debug/listing
// };


// controllers/poTrackingController.js
const { pool } = require("../config/db");

async function createTrackingRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { inserted: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cols = [
      "po_id",
      "item_id",
      "item_description",
      "quantity_ordered",
      "quantity_received",
      "quantity_pending",
      "status",
    ];

    const values = records.map((r) => [
      r.po_id,
      r.item_id ?? null,
      r.item_description ?? null,
      parseFloat(r.quantity_ordered || 0),
      parseFloat(r.quantity_received || 0),
      parseFloat(r.quantity_pending || 0),
      r.status ?? "pending",
    ]);

    const sql = `INSERT INTO po_material_tracking (${cols.join(", ")}) VALUES ?`;
    await conn.query(sql, [values]);

    await conn.commit();
    return { inserted: values.length };
  } catch (err) {
    await conn.rollback();
    console.error("poTracking.createTrackingRecords error", err);
    throw err;
  } finally {
    conn.release();
  }
}

async function createTrackingHandler(req, res) {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "records array is required" });
  }
  try {
    const result = await createTrackingRecords(records);
    return res.status(201).json(result);
  } catch (err) {
    console.error("createTrackingHandler error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

async function listTrackingHandler(req, res) {
  try {
    const poId = req.query.po_id;
    let sql = `SELECT * FROM po_material_tracking`;
    const params = [];
    if (poId) {
      sql += ` WHERE po_id = ?`;
      params.push(poId);
    }
    sql += ` ORDER BY created_at DESC LIMIT 1000`;
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("listTrackingHandler error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

module.exports = {
  createTrackingRecords,
  createTracking: createTrackingRecords,
  createTrackingHandler,
  listTrackingHandler,
};
