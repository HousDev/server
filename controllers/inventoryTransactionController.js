const { query } = require("../config/db");
const inventoryTransactionModel = require("../models/inventoryTransactionsModel");
const inventoryModel = require("../models/inventoryModel");

/**
 * Validate inventory transaction payload
 */
function validateTransaction(data) {
  const errors = [];

  if (!data.inventory_item_id || isNaN(data.inventory_item_id)) {
    errors.push("Valid inventory_item_id is required");
  }

  if (
    data.transaction_qty === undefined ||
    !Number.isInteger(data.transaction_qty) ||
    data.transaction_qty <= 0
  ) {
    errors.push("transaction_qty must be a positive integer");
  }

  if (!["CREDIT", "DEBIT"].includes(data.transaction_type)) {
    errors.push("transaction_type must be CREDIT or DEBIT");
  }

  if (data.remark && typeof data.remark !== "string") {
    errors.push("remark must be a string");
  }

  return errors;
}

/**
 * Create inventory transaction (CREDIT / DEBIT)
 */
async function createInventoryTransaction(req, res) {
  try {
    const errors = validateTransaction(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const {
      inventory_item_id,
      transaction_qty,
      transaction_type,
      remark,
      previous_qty,
    } = req.body;
    console.log(
      inventory_item_id,
      transaction_qty,
      transaction_type,
      remark,
      previous_qty
    );

    // Check inventory item exists
    const inventory = await inventoryModel.findInventoryById(inventory_item_id);
    console.log(inventory);
    if (inventory.length === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const currentQty = inventory.quantity;

    // Prevent negative stock on DEBIT
    if (transaction_type === "DEBIT" && currentQty < transaction_qty) {
      return res.status(400).json({
        message: "Insufficient stock for debit transaction",
      });
    }

    // Insert transaction log
    const result = await inventoryTransactionModel.createInventoryTransaction({
      inventory_item_id,
      transaction_qty,
      transaction_type,
      previous_qty,
      remark,
    });

    // Update inventory quantity
    if (transaction_type === "CREDIT") {
      await query("UPDATE inventory SET quantity = quantity + ? WHERE id = ?", [
        transaction_qty,
        inventory_item_id,
      ]);
    } else {
      await query("UPDATE inventory SET quantity = quantity - ? WHERE id = ?", [
        transaction_qty,
        inventory_item_id,
      ]);
    }

    return res.status(201).json({
      message: "Inventory transaction created successfully",
      transaction_id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * UPDATE inventory transaction
 * (quantity & remark only)
 */
async function updateInventoryTransaction(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const errors = validateTransaction(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existing =
      await inventoryTransactionModel.findInventoryTransactionById(id);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const tx = existing[0];
    const diff = req.body.transaction_qty - tx.transaction_qty;

    const inventory = await inventoryModel.findInventoryById(
      tx.inventory_item_id
    );

    if (inventory.length === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const currentQty = inventory[0].quantity;

    // Prevent negative stock on update
    if (tx.transaction_type === "DEBIT" && currentQty < diff) {
      return res.status(400).json({ message: "Insufficient stock for update" });
    }

    if (diff !== 0) {
      if (tx.transaction_type === "CREDIT") {
        await query(
          "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
          [diff, tx.inventory_item_id]
        );
      } else {
        await query(
          "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
          [diff, tx.inventory_item_id]
        );
      }
    }

    await inventoryTransactionModel.updateInventoryTransaction(id, req.body);

    return res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get all inventory transactions
 */
async function getAllInventoryTransactions(req, res) {
  try {
    const data = await inventoryTransactionModel.findAllInventoryTransactions();
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get transactions by item ID
 */
async function getTransactionsByItemId(req, res) {
  try {
    const { inventory_item_id } = req.params;

    if (!inventory_item_id || isNaN(inventory_item_id)) {
      return res.status(400).json({ message: "Invalid inventory_item_id" });
    }

    const data = await inventoryTransactionModel.findTransactionsByItemId(
      inventory_item_id
    );

    return res.json(data[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Delete transaction (audit risk – usually restricted)
 */
async function deleteInventoryTransaction(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const existing =
      await inventoryTransactionModel.findInventoryTransactionById(id);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // ⚠️ Usually restrict this to admin only
    await inventoryTransactionModel.deleteInventoryTransaction(id);

    return res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createInventoryTransaction,
  getAllInventoryTransactions,
  getTransactionsByItemId,
  deleteInventoryTransaction,
  updateInventoryTransaction,
};
