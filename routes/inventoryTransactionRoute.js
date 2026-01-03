const express = require("express");
const InventoryTransactionRouter = express.Router();
const upload = require("../middleware/upload");

const {
  createInventoryTransaction,
  getAllInventoryTransaction,
  createInventoryTransactionOut,
  createInventoryTransactionIssueMaterial,
  getAllIssueMaterialInventoryTransaction,
} = require("../controllers/inventoryTransactionController");

/**
 * Inventory transaction routes
 */
InventoryTransactionRouter.post(
  "/",
  upload.single("challan_image"),
  createInventoryTransaction
);

InventoryTransactionRouter.post("/materialOut", createInventoryTransactionOut);

InventoryTransactionRouter.post(
  "/issueMaterial",
  createInventoryTransactionIssueMaterial
);

// Get all transactions
InventoryTransactionRouter.get("/", getAllInventoryTransaction);
InventoryTransactionRouter.get(
  "/issueMaterialTransaction",
  getAllIssueMaterialInventoryTransaction
);

module.exports = InventoryTransactionRouter;
