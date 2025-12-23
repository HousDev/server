const express = require("express");
const InventoryTransactionRouter = express.Router();

const {
  createInventoryTransaction,
  getAllInventoryTransactions,
  getTransactionsByItemId,
  deleteInventoryTransaction,
  updateInventoryTransaction,
} = require("../controllers/inventoryTransactionController");

/**
 * Inventory transaction routes
 */

// Create CREDIT / DEBIT transaction
InventoryTransactionRouter.post("/", createInventoryTransaction);

// Get all transactions
InventoryTransactionRouter.get("/", getAllInventoryTransactions);

// Get transactions by inventory item id
InventoryTransactionRouter.get("/:inventory_item_id", getTransactionsByItemId);

// Delete transaction (admin only – recommended)
InventoryTransactionRouter.delete("/:id", deleteInventoryTransaction);
InventoryTransactionRouter.put("/:id", updateInventoryTransaction);

module.exports = InventoryTransactionRouter;
