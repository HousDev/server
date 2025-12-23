const inventoryModel = require("../models/inventoryModel");

/**
 * Validate inventory payload
 */

function validateInventory(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== "string") {
      errors.push("Name is required and must be a string");
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== "string") {
      errors.push("Description is required and must be a string");
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category || typeof data.category !== "string") {
      errors.push("Category is required and must be a string");
    }
  }

  if (!isUpdate || data.quantity !== undefined) {
    if (
      data.quantity === undefined ||
      !Number.isInteger(data.quantity) ||
      data.quantity < 0
    ) {
      errors.push("Quantity must be a non-negative integer");
    }
  }

  if (!isUpdate || data.reorder_qty !== undefined) {
    if (
      data.reorder_qty === undefined ||
      !Number.isInteger(data.reorder_qty) ||
      data.reorder_qty < 0
    ) {
      errors.push("Reorder quantity must be a non-negative integer");
    }
  }

  if (!isUpdate || data.unit !== undefined) {
    if (!data.unit || typeof data.unit !== "string") {
      errors.push("Unit is required and must be a string");
    }
  }

  return errors;
}

/**
 * Create inventory
 */
async function createInventory(req, res) {
  try {
    const errors = validateInventory(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const result = await inventoryModel.createInventory(req.body);

    return res.status(201).json({
      message: "Inventory created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Update inventory
 */
async function updateInventory(req, res) {
  try {
    const { id } = req.params;
    console.log(req.body, id);

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }

    const errors = validateInventory(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existing = await inventoryModel.findInventoryById(id);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    await inventoryModel.updateInventory(id, req.body);

    return res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Delete inventory
 */
async function deleteInventory(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }

    const existing = await inventoryModel.findInventoryById(id);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    await inventoryModel.deleteInventory(id);

    return res.json({ message: "Inventory deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get inventory by ID
 */
async function getInventoryById(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }

    const data = await inventoryModel.findInventoryById(id);
    if (data.length === 0) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    return res.json(data[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get all inventory
 */
async function getAllInventory(req, res) {
  try {
    const data = await inventoryModel.findAllInventory();
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryById,
  getAllInventory,
};
