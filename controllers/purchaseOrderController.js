// // controllers/purchaseOrderController.js
// const { pool } = require("../config/db");
// const poSeq = require("./poSequenceController"); // must export nextNumber()

// /**
//  * Create PO - dynamic SQL builder so placeholders always match values.
//  */
// async function createPO(req, res) {
//   const payload = req.body;

//   if (!payload || !payload.vendor_id || !Array.isArray(payload.items)) {
//     return res
//       .status(400)
//       .json({ error: "vendor_id and items[] are required" });
//   }

//   // get next PO number
//   let poNumber;
//   try {
//     const seq = await poSeq.nextNumber();
//     poNumber = seq.po_number;
//   } catch (err) {
//     console.error("sequence generation failed", err);
//     return res.status(500).json({ error: "failed generating PO number" });
//   }

//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     // columns we will insert into (order matters for values)
//     const columns = [
//       "po_number",
//       "vendor_id",
//       "project_id",
//       "po_type_id",
//       "po_date",
//       "delivery_date",
//       "is_interstate",

//       "subtotal",
//       "discount_percentage",
//       "discount_amount",
//       "taxable_amount",

//       "cgst_amount",
//       "sgst_amount",
//       "igst_amount",
//       "total_gst_amount",
//       "grand_total",

//       "payment_terms_id",
//       "advance_amount",
//       "total_paid",
//       "balance_amount",

//       "selected_terms_ids",
//       "terms_and_conditions",
//       "notes",

//       "status",
//       "material_status",
//       "payment_status",
//       "created_by",
//     ];

//     // build values array in the same order
//     const values = [
//       poNumber,
//       payload.vendor_id,
//       payload.project_id || null,
//       payload.po_type_id || null,
//       payload.po_date || null,
//       payload.delivery_date || null,
//       payload.is_interstate ? 1 : 0,

//       parseFloat(payload.subtotal || 0),
//       parseFloat(payload.discount_percentage || 0),
//       parseFloat(payload.discount_amount || 0),
//       parseFloat(payload.taxable_amount || 0),

//       parseFloat(payload.cgst_amount || 0),
//       parseFloat(payload.sgst_amount || 0),
//       parseFloat(payload.igst_amount || 0),
//       parseFloat(payload.total_gst_amount || 0),
//       parseFloat(payload.grand_total || 0),

//       payload.payment_terms_id || null,
//       parseFloat(payload.advance_amount || 0),
//       parseFloat(payload.total_paid || 0),
//       parseFloat(payload.balance_amount || 0),

//       payload.selected_terms_ids
//         ? JSON.stringify(payload.selected_terms_ids)
//         : JSON.stringify([]),
//       payload.terms_and_conditions || null,
//       payload.notes || null,

//       payload.status || "draft",
//       payload.material_status || "pending",
//       payload.payment_status || "pending",
//       payload.created_by || null,
//     ];

//     // Build dynamic placeholders string matching values length
//     const placeholders = values.map(() => "?").join(", ");
//     const insertSQL = `INSERT INTO purchase_orders (${columns.join(
//       ", "
//     )}) VALUES (${placeholders})`;

//     // final safety check (should never fail now)
//     if ((insertSQL.match(/\?/g) || []).length !== values.length) {
//       console.error("Sanity check failed: placeholders mismatch", {
//         placeholdersCount: (insertSQL.match(/\?/g) || []).length,
//         valuesLength: values.length,
//         insertSQL,
//       });
//       throw new Error("SQL placeholders mismatch (internal sanity check)");
//     }

//     const [poResult] = await conn.query(insertSQL, values);
//     const newPoId = poResult.insertId;

//     // insert items in bulk
//     if (Array.isArray(payload.items) && payload.items.length > 0) {
//       const itemColumns = [
//         "po_id",
//         "item_id",
//         "item_code",
//         "item_name",
//         "description",
//         "hsn_code",
//         "quantity",
//         "unit",
//         "rate",
//         "amount",
//         "gst_rate",
//         "gst_amount",
//       ];

//       const itemPlaceholders = `(${itemColumns.map(() => "?").join(", ")})`;
//       // We'll use bulk insert with VALUES ?
//       const itemSql = `INSERT INTO purchase_order_items (${itemColumns.join(
//         ", "
//       )}) VALUES ?`;

//       const itemsValues = payload.items.map((it) => [
//         newPoId,
//         it.item_id || null,
//         it.item_code || null,
//         it.item_name || null,
//         it.description || null,
//         it.hsn_code || null,
//         parseFloat(it.quantity || 0),
//         it.unit || null,
//         parseFloat(it.rate || 0),
//         parseFloat(it.amount || 0),
//         parseFloat(it.gst_rate || 0),
//         parseFloat(it.gst_amount || 0),
//       ]);

//       // itemsValues is an array-of-arrays; mysql2 accepts [itemsValues] for VALUES ?
//       await conn.query(itemSql, [itemsValues]);
//     }

//     await conn.commit();
//     return res.status(201).json({ id: newPoId, po_number: poNumber });
//   } catch (err) {
//     await conn.rollback();
//     console.error("createPO error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   } finally {
//     conn.release();
//   }
// }

// /**
//  * Simple fetch list of POs (join vendor name). Add filters/pagination later.
//  */
// async function getPOs(req, res) {
//   try {
//     const [rows] = await pool.query(`
//       SELECT p.*, v.name AS vendor_name
//       FROM purchase_orders p
//       LEFT JOIN vendors v ON v.id = p.vendor_id
//       ORDER BY p.created_at DESC
//       LIMIT 500
//     `);
//     return res.json(rows);
//   } catch (err) {
//     console.error("getPOs error", err);
//     return res.status(500).json({ error: err.message || "internal" });
//   }
// }

// module.exports = {
//   createPO,
//   getPOs,
// };

// controllers/purchaseOrderController.js
const { pool, query } = require("../config/db");
const poSeq = require("./poSequenceController");
const poTracking = require("./poTrackingController"); // used to call createTrackingRecords if needed
const {
  updatePO,
  findById,
  deletePO,
  updatePO_Status,
  deletePOItems,
} = require("../models/poModel");

async function createPO(req, res) {
  const payload = req.body;

  if (!payload || !payload.vendor_id || !Array.isArray(payload.items)) {
    return res
      .status(400)
      .json({ error: "vendor_id and items[] are required" });
  }

  // get next PO number using internal function
  let poNumber;
  try {
    const seq = await poSeq.nextNumber();
    poNumber = seq.po_number;
  } catch (err) {
    console.error("sequence generation failed", err);
    return res.status(500).json({ error: "failed generating PO number" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // columns and values (order must match)
    const columns = [
      "po_number",
      "vendor_id",
      "project_id",
      "po_type_id",
      "po_date",
      "delivery_date",
      "is_interstate",

      "subtotal",
      "discount_percentage",
      "discount_amount",
      "taxable_amount",

      "cgst_amount",
      "sgst_amount",
      "igst_amount",
      "total_gst_amount",
      "grand_total",

      "payment_terms",
      "advance_amount",
      "total_paid",
      "balance_amount",

      "selected_terms_ids",
      "terms_and_conditions",
      "notes",

      "status",
      "material_status",
      "payment_status",
      "created_by",
    ];

    // coerce numeric values and created_by -> INT or null
    // const createdBy = Number(payload.created_by);
    // const createdByVal = Number.isInteger(createdBy) ? createdBy : null;

    const values = [
      poNumber,
      payload.vendor_id,
      payload.project_id || null,
      payload.po_type_id || null,
      payload.po_date || null,
      payload.delivery_date || null,
      payload.is_interstate ? 1 : 0,

      parseFloat(payload.subtotal || 0),
      parseFloat(payload.discount_percentage || 0),
      parseFloat(payload.discount_amount || 0),
      parseFloat(payload.taxable_amount || 0),

      parseFloat(payload.cgst_amount || 0),
      parseFloat(payload.sgst_amount || 0),
      parseFloat(payload.igst_amount || 0),
      parseFloat(payload.total_gst_amount || 0),
      parseFloat(payload.grand_total || 0),
      payload.payment_terms
        ? JSON.stringify(payload.payment_terms)
        : JSON.stringify([]),
      parseFloat(payload.advance_amount || 0),
      parseFloat(payload.total_paid || 0),
      parseFloat(payload.balance_amount || 0),

      payload.selected_terms_ids
        ? JSON.stringify(payload.selected_terms_ids)
        : JSON.stringify([]),
      payload.terms_and_conditions || null,
      payload.notes || null,

      payload.status || "draft",
      payload.material_status || "pending",
      payload.payment_status || "pending",
      payload.created_by,
    ];

    // dynamic placeholders
    const placeholders = values.map(() => "?").join(", ");
    const insertSQL = `INSERT INTO purchase_orders (${columns.join(
      ", ",
    )}) VALUES (${placeholders})`;

    // sanity check
    if ((insertSQL.match(/\?/g) || []).length !== values.length) {
      console.error("Sanity check failed: placeholders mismatch", {
        placeholdersCount: (insertSQL.match(/\?/g) || []).length,
        valuesLength: values.length,
        insertSQL,
      });
      throw new Error("SQL placeholders mismatch (internal sanity check)");
    }

    const [poResult] = await conn.query(insertSQL, values);
    const newPoId = poResult.insertId;

    // Insert items bulk if present
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      const itemColumns = [
        "po_id",
        "item_id",
        "item_code",
        "item_name",
        "description",
        "hsn_code",
        "quantity",
        "unit",
        "rate",
        "amount",
        "igst_rate",
        "cgst_rate",
        "sgst_rate",
        "gst_amount",
      ];

      const itemsValues = payload.items.map((it) => [
        newPoId,
        it.item_id || null,
        it.item_code || null,
        it.item_name || null,
        it.description || null,
        it.hsn_code || null,
        parseFloat(it.quantity || 0),
        it.unit || null,
        parseFloat(it.rate || 0),
        parseFloat(it.amount || 0),
        parseFloat(it.igst_rate || 0),
        parseFloat(it.cgst_rate || 0),
        parseFloat(it.sgst_rate || 0),
        parseFloat(it.gst_amount || 0),
      ]);

      // Bulk insert: VALUES ?
      const itemSql = `INSERT INTO purchase_order_items (${itemColumns.join(
        ", ",
      )}) VALUES ?`;
      await conn.query(itemSql, [itemsValues]);
    }

    // optionally create tracking records using poTracking internal helper
    // (the purchaseOrderController can call createTrackingRecords directly if desired)
    // e.g. if payload.auto_create_tracking true -> create
    if (
      payload.auto_create_tracking &&
      Array.isArray(payload.items) &&
      payload.items.length
    ) {
      const trackingRecords = payload.items.map((item) => ({
        po_id: newPoId,
        item_id: item.item_id || null,
        item_description: item.item_name || item.description || null,
        quantity_ordered: parseFloat(item.quantity || 0),
        quantity_received: 0,
        quantity_pending: parseFloat(item.quantity || 0),
        status: "pending",
      }));
      await poTracking.createTrackingRecords(trackingRecords);
    }

    await conn.commit();
    return res.status(201).json({ id: newPoId, po_number: poNumber });
  } catch (err) {
    await conn.rollback();
    console.error("createPO error", err);
    return res.status(500).json({ error: err.message || "internal" });
  } finally {
    conn.release();
  }
}

const getItemsOfPO = async (req, res) => {
  try {
    const rows = await query("SELECT * FROM purchase_order_items");

    return res.status(200).json({ message: "PO Items fetched.", data: rows });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

/**
 * GET POs list (simple join vendor)
 */
async function getPOs(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, v.name AS vendor_name
      FROM purchase_orders p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      ORDER BY p.created_at DESC
      LIMIT 500
    `);
    return res.json(rows);
  } catch (err) {
    console.error("getPOs error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

async function updatePurchaseOrder(req, res) {
  try {
    const payload = req.body;
    const { poId } = req.params;

    const poData = await updatePO(poId, payload);
    return res.status(200).json({
      message: "PO Updated Successfully.",
      data: poData,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

async function deletePurchaseOrder(req, res) {
  try {
    const { poId } = req.params;
    if (!poId) {
      return res.status(400).json({ message: "All fields required." });
    }
    const existing = await findById(poId);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found." });
    }
    const po = await deletePO(poId);
    return res.status(200).json({
      message: "PO Deleted Successfully.",
      status: "successful",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function updatePurchaseOrderStatus(req, res) {
  try {
    const { poId } = req.params;
    const { status } = req.body;
    // poId, vendor_id, project_id);
    if (!poId || !status) {
      return res.status(400).json({ message: "All fields required." });
    }
    const existing = await findById(poId);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found." });
    }
    const po = await updatePO_Status(poId, status);
    // po, "from up");
    return res.status(200).json({
      message: "PO Updated Successfully.",
      data: po,
      status: "successful",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
const deletePOItem = async (req, res) => {
  try {
    const { poItemId, poMaterialTrackingId } = req.params;
    const responseOfDelete = await deletePOItems(
      poItemId,
      poMaterialTrackingId,
    );
    if (
      responseOfDelete.poDeleteMaterialTracking.affectedRows === 1 &&
      responseOfDelete.poDeleteItem === 1
    ) {
      return res
        .status(200)
        .json({ message: "PO Item Deleted.", status: "Completed" });
    } else {
      return res
        .status(400)
        .json({ message: "Faild to delete PO item.", status: "Faild" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

module.exports = {
  getItemsOfPO,
  createPO,
  getPOs,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePOItem,
};
