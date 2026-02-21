// models/inventoryModel.js
const { query } = require("../config/db");

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
    [item_id, quantity, reorder_qty],
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
    [quantity, reorder_qty, id],
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

async function findInventoryByItem_idAndProject_id(id, project_id) {
  const data = await query(
    "SELECT * FROM inventory WHERE item_id = ? AND project_id = ?",
    [id, project_id],
  );
  return data[0];
}

/**
 * Find all inventory items - UPDATED WITH JOIN
 */
async function findAllInventory() {
  // ✅ FIX: Join with items table to get all necessary fields
  return await query(`
    SELECT 
      inv.*,
      it.item_code,
      it.item_name,
      it.item_category,
      it.item_sub_category,
      it.unit,
      it.standard_rate,
      it.description,
      CONCAT(p.name ," ",
      p.location ) as location
    FROM inventory inv
    LEFT JOIN items it ON inv.item_id = it.id LEFT JOIN projects as p ON p.id = inv.project_id
    ORDER BY inv.id DESC
  `);
}

module.exports = {
  createInventory,
  updateInventory,
  deleteInventory,
  findInventoryById,
  findAllInventory,
  findInventoryByItem_idAndProject_id,
  findInventoryByItem_id,
  updateInventoryItemQuantity,
};
