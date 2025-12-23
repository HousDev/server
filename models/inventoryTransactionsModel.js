// models/inventoryTransactionModel.js
const { query } = require("../config/db");

/**
 * Create inventory transaction
 */
async function createInventoryTransaction(data) {
  const {
    previous_qty,
    inventory_item_id,
    transaction_qty,
    transaction_type,
    remark,
  } = data;

  return await query(
    `
    INSERT INTO inventory_transactions
      (inventory_item_id, transaction_qty, transaction_type, remark,previous_qty)
    VALUES (?, ?, ?, ?,?)
    `,
    [inventory_item_id, transaction_qty, transaction_type, remark, previous_qty]
  );
}

/**
 * UPDATE transaction
 * (quantity or remark only – type & inventory_item_id should NOT change)
 */
async function updateInventoryTransaction(id, data) {
  const { transaction_qty, remark } = data;

  return await query(
    `
    UPDATE inventory_transactions
    SET transaction_qty = ?, remark = ?
    WHERE id = ?
    `,
    [transaction_qty, remark, id]
  );
}

/**
 * Find transaction by ID
 */
async function findInventoryTransactionById(id) {
  return await query("SELECT * FROM inventory_transactions WHERE id = ?", [id]);
}

/**
 * Find all transactions
 */
async function findAllInventoryTransactions() {
  return await query(
    `
    SELECT it.*, i.name AS item_name
    FROM inventory_transactions it
    JOIN inventory i ON i.id = it.inventory_item_id
    ORDER BY it.id DESC
    `
  );
}

/**
 * Find transactions by inventory_item_id
 */
async function findTransactionsByItemId(inventory_item_id) {
  return await query(
    `
    SELECT *
    FROM inventory_transactions
    WHERE inventory_item_id = ?
    ORDER BY id DESC
    `,
    [inventory_item_id]
  );
}

/**
 * Delete transaction
 */
async function deleteInventoryTransaction(id) {
  return await query("DELETE FROM inventory_transactions WHERE id = ?", [id]);
}

module.exports = {
  createInventoryTransaction,
  findInventoryTransactionById,
  findAllInventoryTransactions,
  findTransactionsByItemId,
  deleteInventoryTransaction,
  updateInventoryTransaction,
};
