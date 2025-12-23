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
const {
  findInventoryByItem_id,
  updateInventoryItemQuantity,
} = require("../models/inventoryModel");
const {
  createInventoryTransaction,
} = require("../models/inventoryTransactionsModel");
const poTrackingMaterial = require("../models/poTrackingModel");

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

    const sql = `INSERT INTO po_material_tracking (${cols.join(
      ", "
    )}) VALUES ?`;
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

const updateTrackingMaterialQuantity = async (req, res) => {
  try {
    console.log("From update traking material");
    const { quantity_received, quantity_pending } = req.body;
    const { id } = req.params;

    console.log(id, quantity_pending, quantity_received);
    if (!id || !quantity_received || !quantity_pending) {
      return res.status(400).json({ message: "All data fields required." });
    }

    const existing = await poTrackingMaterial.findById(Number(id));
    console.log(existing);
    if (!existing) {
      return res.status(404).json({ message: "Data not found." });
    }
    const status = Number(quantity_pending) === 0 ? "completed" : "pending";

    const trackingMaterial = await poTrackingMaterial.updateMaterialQuantity(
      id,
      Number(existing.quantity_received) + Number(quantity_received),
      quantity_pending,
      status
    );
    console.log("tracking", trackingMaterial);

    if (trackingMaterial.id && Number(quantity_received) > 0) {
      const storeItem = await findInventoryByItem_id(existing.item_id);
      console.log("inventory", storeItem);
      const updatedInventoryItem = await updateInventoryItemQuantity(
        storeItem.id,
        Number(storeItem.quantity) + Number(quantity_received)
      );

      console.log(updatedInventoryItem);
      await createInventoryTransaction({
        inventory_item_id: storeItem.id,
        transaction_qty: quantity_received,
        transaction_type: "CREDIT",
        remark: "added to inventory",
        previous_qty: storeItem.quantity,
      });
    }

    return res.status(200).json({
      message: "Updated Tracking Material Quantity.",
      data: trackingMaterial,
      status: "Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

module.exports = {
  createTrackingRecords,
  createTracking: createTrackingRecords,
  createTrackingHandler,
  listTrackingHandler,
  updateTrackingMaterialQuantity,
};
