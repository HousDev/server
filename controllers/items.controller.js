// backend/controllers/items.controller.js
const { createInventory } = require("../models/inventoryModel");
const Items = require("../models/items.model");

exports.listItems = async (req, res) => {
  try {
    const rows = await Items.findAll();
    res.json(rows);
  } catch (err) {
    console.error("listItems error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

exports.getItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await Items.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error("getItem error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

exports.createItem = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.item_code || !payload.item_name) {
      return res
        .status(400)
        .json({ message: "item_code and item_name are required" });
    }

    // check duplicate code
    const existing = await Items.findByCode(payload.item_code);
    if (existing) {
      return res.status(409).json({ message: "Item code already exists" });
    }

    const created = await Items.create(payload);
    if (created.id && payload.category === "material") {
      const data = {
        item_id: created.id,
        name: payload.item_name,
        description: payload.description,
        category: payload.category,
        quantity: 0,
        reorder_qty: 10,
        unit: payload.unit,
      };
      const createInventoryRes = await createInventory(data);
      console.log(createInventoryRes);
    }
    res.status(201).json(created);
  } catch (err) {
    console.error("createItem error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body;

    // if updating code, ensure uniqueness
    if (payload.item_code) {
      const found = await Items.findByCode(payload.item_code);
      if (found && found.id !== id) {
        return res.status(409).json({ message: "Item code already exists" });
      }
    }

    const updated = await Items.update(id, payload);
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateItem error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ok = await Items.remove(id);
    if (!ok) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteItem error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await Items.toggleActive(id);
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json(updated);
  } catch (err) {
    console.error("toggleActive error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};
