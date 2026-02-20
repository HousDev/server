// models/inventoryTransactionModel.js
const { pool, query } = require("../config/db");
const inventoryModel = require("../models/inventoryModel");
const poTrackingMaterial = require("../models/poTrackingModel");

const createInventoryTransaction = async (transactionData) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      po_id,
      vendor_id,
      challan_number,
      challan_image,
      receiving_date,
      receiver_name,
      receiver_phone,
      delivery_location,
      items,
    } = transactionData;

    // 1️⃣ Insert transaction
    const [trxResult] = await connection.execute(
      `INSERT INTO inventory_transactions
       (po_id, vendor_id, challan_number, challan_image,
        receiving_date, receiver_name, receiver_phone,
        trasaction_type, delivery_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'INWARD', ?)`,
      [
        po_id,
        vendor_id,
        challan_number,
        challan_image,
        receiving_date,
        receiver_name,
        receiver_phone,
        delivery_location,
      ],
    );

    const transactionId = trxResult.insertId;
    let receivedMaterialAmount = 0;
    // 2️⃣ Items + inventory + PO tracking
    for (const item of items) {
      const inventoryMaterial = await inventoryModel.findInventoryByItem_id(
        item.id,
      );

      const [[itemDetails]] = await connection.query(
        "SELECT * FROM purchase_order_items WHERE item_id = ? AND po_id = ?",
        [item.id, po_id],
      );

      await connection.execute(
        `INSERT INTO inventory_transactions_items
         (transaction_id, item_id, quantity_issued, initial_quantity)
         VALUES (?, ?, ?, ?)`,
        [
          transactionId,
          item.id,
          item.quantity_issued,
          inventoryMaterial.quantity,
        ],
      );

      const poTracking = await poTrackingMaterial.findByIdAndPO_ID(
        item.id,
        po_id,
      );

      if (item.quantity_issued > poTracking.quantity_pending) {
        throw new Error("Issued quantity exceeds pending quantity");
      }

      const status =
        poTracking.quantity_pending - item.quantity_issued === 0
          ? "completed"
          : poTracking.quantity_pending - item.quantity_issued > 0
            ? "partial"
            : "pending";

      await connection.execute(
        `UPDATE po_material_tracking SET
         quantity_received = quantity_received + ?,
         quantity_pending = quantity_pending - ?,
         status = ?
         WHERE id = ?`,
        [item.quantity_issued, item.quantity_issued, status, poTracking.id],
      );

      const [[findPoStatus]] = await connection.execute(
        `
  SELECT
    SUM(status = 'pending')   AS pending_count,
    SUM(status = 'partial')   AS partial_count,
    SUM(status = 'completed') AS completed_count
  FROM po_material_tracking
  WHERE po_id = ?
  `,
        [po_id],
      );

      let po_material_status = "completed";

      if (findPoStatus.pending_count > 0) {
        po_material_status = "pending";
      } else if (findPoStatus.partial_count > 0) {
        po_material_status = "partial";
      }

      await connection.execute(
        `UPDATE purchase_orders SET material_status = ? WHERE id = ?`,
        [po_material_status, po_id],
      );

      await connection.execute(
        `UPDATE inventory SET quantity = quantity + ?, quantity_after_approve = quantity_after_approve+? WHERE id = ?`,
        [item.quantity_issued, item.quantity_issued, inventoryMaterial.id],
      );

      receivedMaterialAmount +=
        Number(itemDetails.rate) * Number(item.quantity_issued);

      receivedMaterialAmount +=
        (Number(itemDetails.gst_amount) / Number(itemDetails.quantity)) *
        item.quantity_issued;
    }

    // 3️⃣ Fetch created transaction
    const [rows] = await connection.execute(
      `SELECT 
        it.*,
        iti.id AS transaction_item_id,
        iti.item_id,
        iti.quantity_issued,
        iti.initial_quantity
       FROM inventory_transactions it
       LEFT JOIN inventory_transactions_items iti
         ON it.id = iti.transaction_id
       WHERE it.id = ?`,
      [transactionId],
    );

    const [[po]] = await connection.query(
      "SELECT * FROM purchase_orders WHERE id = ?",
      [po_id],
    );

    const terms = po.payment_terms;
    if (terms) {
      for (let t of terms) {
        const date = new Date();
        date.setDate(
          date.getDate() + (t.gracePeriod ? Number(t.gracePeriod) : 0),
        );
        if (
          t.event_trigger === "On Delivery" ||
          t.event_trigger === "After Delivery"
        ) {
          const balance =
            (Number(receivedMaterialAmount) * Number(t.percentPayment)) / 100;

          await connection.query(
            `INSERT INTO po_payments (
        po_id,
        total_amount,
        amount_paid,
        balance_amount,
        payment_due_date,
        status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
            [po_id, balance, 0, balance, date, "PENDING"],
          );
        }
      }
    }
    await connection.commit();

    return {
      ...rows[0],
      items: rows.map((r) => ({
        transaction_item_id: r.transaction_item_id,
        item_id: r.item_id,
        quantity_issued: r.quantity_issued,
        initial_quantity: r.initial_quantity,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createInventoryTransactionOut = async (transactionData) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      remark,
      receiving_date,
      receiver_name,
      receiver_phone,
      delivery_location,
      items,
    } = transactionData;

    // 1️⃣ Insert transaction
    const [trxResult] = await connection.execute(
      `INSERT INTO inventory_transactions
       (remark,
        receiving_date, receiver_name, receiver_phone,
        trasaction_type, delivery_location)
       VALUES ( ?, ?, ?, ?, 'OUTWARD', ?)`,
      [
        remark,
        receiving_date,
        receiver_name,
        receiver_phone,
        delivery_location,
      ],
    );

    const transactionId = trxResult.insertId;

    // 2️⃣ Items + inventory + PO tracking
    for (const item of items) {
      const inventoryMaterial = await inventoryModel.findInventoryByItem_id(
        item.materialId,
      );

      await connection.execute(
        `INSERT INTO inventory_transactions_items
         (transaction_id, item_id, quantity_issued, initial_quantity)
         VALUES (?, ?, ?, ?)`,
        [
          transactionId,
          item.materialId,
          item.quantity,
          inventoryMaterial.quantity,
        ],
      );

      await connection.execute(
        `UPDATE inventory SET quantity = quantity - ? WHERE id = ?`,
        [item.quantity, inventoryMaterial.id],
      );
    }

    // 3️⃣ Fetch created transaction
    const [rows] = await connection.execute(
      `SELECT 
        it.*,
        iti.id AS transaction_item_id,
        iti.item_id,
        iti.quantity_issued,
        iti.initial_quantity
       FROM inventory_transactions it
       LEFT JOIN inventory_transactions_items iti
         ON it.id = iti.transaction_id
       WHERE it.id = ?`,
      [transactionId],
    );

    await connection.commit();

    return {
      ...rows[0],
      items: rows.map((r) => ({
        transaction_item_id: r.transaction_item_id,
        item_id: r.item_id,
        quantity_issued: r.quantity_issued,
        initial_quantity: r.initial_quantity,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createInventoryTransactionIssueMaterial = async (transactionData) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      purpose,
      projectId,
      buildingId,
      floorId,
      flatId,
      commonAreaId,
      vendorId,
      receiver_name,
      receiver_number,
      issue_date,
      items,
    } = transactionData;

    // 1️⃣ Insert transaction
    const [trxResult] = await connection.execute(
      `INSERT INTO issue_material_transactions
       (purpose,
        projectId, buildingId, floorId,
        flatId, commonAreaId,vendorId,receiver_name,receiver_number,issue_date)
       VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purpose,
        projectId,
        buildingId,
        floorId,
        flatId,
        commonAreaId,
        vendorId,
        receiver_name,
        receiver_number,
        issue_date,
      ],
    );

    const transactionId = trxResult.insertId;

    // 2️⃣ Items + inventory + PO tracking
    for (const item of items) {
      const inventoryMaterial = await inventoryModel.findInventoryById(
        item.materialId,
      );

      await connection.execute(
        `INSERT INTO issue_material_transactions_items
         (transaction_id, item_id, quantity_issued, initial_quantity)
         VALUES (?, ?, ?, ?)`,
        [
          transactionId,
          inventoryMaterial.item_id,
          item.quantity,
          inventoryMaterial.quantity,
        ],
      );

      await connection.execute(
        `UPDATE inventory SET quantity = quantity - ?, quantity_after_approve = quantity_after_approve + ? WHERE id = ?`,
        [
          item.quantity,
          Number(item.approved_qauntity) - Number(item.quantity),
          inventoryMaterial.id,
        ],
      );
    }

    // 3️⃣ Fetch created transaction
    const [rows] = await connection.execute(
      `SELECT 
        it.*,
        iti.id AS transaction_item_id,
        iti.item_id,
        iti.quantity_issued,
        iti.initial_quantity
       FROM issue_material_transactions it
       LEFT JOIN issue_material_transactions_items iti
         ON it.id = iti.transaction_id
       WHERE it.id = ?`,
      [transactionId],
    );

    if (transactionData.materialRequest) {
      await connection.execute(
        `UPDATE request_material SET status = "completed" WHERE id = ?`,
        [transactionData.materialRequest],
      );
    }

    await connection.commit();

    return {
      ...rows[0],
      items: rows.map((r) => ({
        transaction_item_id: r.transaction_item_id,
        item_id: r.item_id,
        quantity_issued: r.quantity_issued,
        initial_quantity: r.initial_quantity,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAllInventoryTransactions = async () => {
  const rows = await query(`
    SELECT 
      it.id AS transaction_id,
      it.po_id,
      it.vendor_id,
      po.po_number,
      v.name,
      it.challan_number,
      it.challan_image,
      it.receiving_date,
      it.receiver_name,
      it.receiver_phone,
      it.trasaction_type,
      it.delivery_location,
      it.created_at,
      it.remark,

      iti.id AS transaction_item_id,
      iti.item_id,
      i.item_name,                
      iti.quantity_issued,
      iti.initial_quantity

    FROM inventory_transactions it

    LEFT JOIN inventory_transactions_items iti
      ON it.id = iti.transaction_id

    LEFT JOIN purchase_orders po
      ON it.po_id = po.id

    LEFT JOIN vendors v
      ON it.vendor_id = v.id

    LEFT JOIN items i               
      ON i.id = iti.item_id

    ORDER BY it.created_at DESC
  `);

  return rows;
};

const getAllIssueMaterialTransactions = async () => {
  const rows = await query(`
    SELECT
      it.id AS transaction_id,
      it.issue_date,
      it.purpose,
      it.receiver_name,
      it.receiver_number,

      p.name AS project_name,
      b.building_name,
      f.floor_name,

      fl.flat_name,
      ca.common_area_name,

      v.name AS vendor_name,

      iti.id AS transaction_item_id,
      i.item_name,
      iti.quantity_issued,
      iti.initial_quantity

    FROM issue_material_transactions it

    JOIN projects p ON p.id = it.projectId
    JOIN buildings b ON b.id = it.buildingId
    JOIN floors f ON f.id = it.floorId
    JOIN vendors v ON v.id = it.vendorId

    LEFT JOIN flats fl ON fl.id = it.flatId
    LEFT JOIN common_areas ca ON ca.id = it.commonAreaId

    JOIN issue_material_transactions_items iti
      ON iti.transaction_id = it.id

    JOIN items i
      ON i.id = iti.item_id

    ORDER BY it.id DESC
  `);

  return rows;
};

module.exports = {
  createInventoryTransaction,
  getAllInventoryTransactions,
  createInventoryTransactionOut,
  createInventoryTransactionIssueMaterial,
  getAllIssueMaterialTransactions,
};
