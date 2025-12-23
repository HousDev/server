const express = require("express");
const InventoryRouter = express.Router();

const {
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryById,
  getAllInventory,
} = require("../controllers/InventoryController");

/**
 * Inventory routes
 */

// Create inventory
InventoryRouter.post("/", createInventory);

// Get all inventory
InventoryRouter.get("/", getAllInventory);

// Get inventory by ID
InventoryRouter.get("/:id", getInventoryById);

// Update inventory
InventoryRouter.put("/:id", updateInventory);

// Delete inventory
InventoryRouter.delete("/:id", deleteInventory);

module.exports = InventoryRouter;
