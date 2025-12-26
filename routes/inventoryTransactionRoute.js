const express = require("express");
const InventoryTransactionRouter = express.Router();
const upload = require("../middleware/upload");

const {
  createInventoryTransaction,
  getAllInventoryTransaction,
} = require("../controllers/inventoryTransactionController");

/**
 * Inventory transaction routes
 */
InventoryTransactionRouter.post(
  "/",
  upload.single("challan_image"),
  createInventoryTransaction
);

// Get all transactions
InventoryTransactionRouter.get("/", getAllInventoryTransaction);

module.exports = InventoryTransactionRouter;
