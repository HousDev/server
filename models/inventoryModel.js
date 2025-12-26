// models/inventoryModel.js
const { query } = require("../config/db");
const { findById } = require("./poTrackingModel");

/**
 * Create inventory item
 * NOTE: status is auto-generated, do NOT pass it
 */
async function createInventory(data) {
  const { item_id, quantity, reorder_qty } = data;

  return await query(
    `
    INSERT INTO inventory
      (item_id, quantity, reorder_qty)
    VALUES (?, ?, ?)
    `,
    [item_id, quantity, reorder_qty]
  );
}

/**
 * Update inventory item
 * status auto updates based on quantity & reorder qty
 */
async function updateInventory(id, data) {
  const { quantity, reorder_qty } = data;

  return await query(
    `
    UPDATE inventory
    SET
      quantity = ?,
      reorder_qty = ?
    WHERE id = ?
    `,
    [quantity, reorder_qty, id]
  );
}

async function updateInventoryItemQuantity(id, quantity) {
  await query(` UPDATE inventory SET quantity = ?  WHERE id = ?`, [
    quantity,
    id,
  ]);
  return findInventoryById(id);
}

/**
 * Delete inventory item
 */
async function deleteInventory(id) {
  return await query("DELETE FROM inventory WHERE id = ?", [id]);
}

/**
 * Find inventory by ID
 */
async function findInventoryById(id) {
  const data = await query("SELECT * FROM inventory WHERE id = ?", [id]);
  return data[0];
}

async function findInventoryByItem_id(id) {
  const data = await query("SELECT * FROM inventory WHERE item_id = ?", [id]);
  return data[0];
}

/**
 * Find all inventory items
 */
async function findAllInventory() {
  return await query("SELECT * FROM inventory ORDER BY id DESC");
}

module.exports = {
  createInventory,
  updateInventory,
  deleteInventory,
  findInventoryById,
  findAllInventory,
  findInventoryByItem_id,
  updateInventoryItemQuantity,
};
