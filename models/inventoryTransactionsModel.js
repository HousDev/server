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
      ]
    );

    const transactionId = trxResult.insertId;

    // 2️⃣ Items + inventory + PO tracking
    for (const item of items) {
      const inventoryMaterial = await inventoryModel.findInventoryByItem_id(
        item.id
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
        ]
      );

      const poTracking = await poTrackingMaterial.findByIdAndPO_ID(
        item.id,
        po_id
      );

      if (item.quantity_issued > poTracking.quantity_pending) {
        throw new Error("Issued quantity exceeds pending quantity");
      }

      const status =
        poTracking.quantity_pending - item.quantity_issued === 0
          ? "completed"
          : "pending";

      await connection.execute(
        `UPDATE po_material_tracking SET
         quantity_received = quantity_received + ?,
         quantity_pending = quantity_pending - ?,
         status = ?
         WHERE id = ?`,
        [item.quantity_issued, item.quantity_issued, status, poTracking.id]
      );

      await connection.execute(
        `UPDATE inventory SET quantity = quantity + ? WHERE id = ?`,
        [item.quantity_issued, inventoryMaterial.id]
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
      [transactionId]
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

const getAllInventoryTransactions = async () => {
  const rows = await query(`
    SELECT 
      it.id AS transaction_id,
      it.po_id,
      it.vendor_id,
      it.challan_number,
      it.challan_image,
      it.receiving_date,
      it.receiver_name,
      it.receiver_phone,
      it.trasaction_type,
      it.delivery_location,
      it.created_at,

      iti.id AS transaction_item_id,
      iti.item_id,
      iti.quantity_issued,
      iti.initial_quantity
    FROM inventory_transactions it
    LEFT JOIN inventory_transactions_items iti
      ON it.id = iti.transaction_id
    ORDER BY it.created_at DESC
  `);

  return rows;
};

module.exports = {
  createInventoryTransaction,
  getAllInventoryTransactions,
};
