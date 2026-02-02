// backend/controllers/items.controller.js
const { createInventory } = require("../models/inventoryModel");
const Items = require("../models/items.model");
const { query } = require("../config/db");

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
    if (
      !payload.item_code ||
      !payload.item_name ||
      !payload.category ||
      !payload.unit
    ) {
      return res.status(400).json({ message: "all fields are required" });
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
        location: payload.location,
      };
      const createInventoryRes = await createInventory(data);
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

exports.importItems = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Invalid items data" });
    }

    const values = items.map((item) => [
      item.item_code,
      item.item_name,
      item.category,
      item.item_category,
      item.item_sub_category,
      item.description,
      item.unit,
      item.hsn_code,
      item.igst_rate ?? 18,
      item.cgst_rate ?? 9,
      item.sgst_rate ?? 9,
      item.standard_rate ?? 0,
      item.is_active ?? 1,
      item.location ?? "",
    ]);

    const sql = `
      INSERT INTO items (
        item_code,
        item_name,
        category,
        item_category,
        item_sub_category,
        description,
        unit,
        hsn_code,
        igst_rate,
        cgst_rate,
        sgst_rate,
        standard_rate,
        is_active, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    values.forEach(async (element) => {
      const item = await query(sql, element);
      query(
        `INSERT INTO inventory(item_id,quantity,quantity_after_approve,reorder_qty) VALUES(?,?,?,?)`,
        [item.insertId, 0, 0, 10],
      );
    });

    res.json({
      success: true,
      inserted: values.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to import items" });
  }
};

exports.getLastItemCode = async (req, res) => {
  try {
    const sql = `
      SELECT item_code
      FROM items
      ORDER BY id DESC
      LIMIT 1
    `;

    const rows = await query(sql);

    if (!rows.length) {
      return res.json({ lastItemCode: "MAT0000" });
    }

    res.json({ lastItemCode: rows[0].item_code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch last item code" });
  }
};

exports.getItemCategories = async (req, res) => {
  try {
    const categories = await Items.getItemCategories();
    res.json(categories);
  } catch (err) {
    console.error("getItemCategories error", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message || err 
    });
  }
};

// Get all item sub-categories
exports.getItemSubCategories = async (req, res) => {
  try {
    const subCategories = await Items.getItemSubCategories();
    res.json(subCategories);
  } catch (err) {
    console.error("getItemSubCategories error", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message || err 
    });
  }
};

// Get items by category
exports.getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await Items.findByCategory(category);
    res.json(items);
  } catch (err) {
    console.error("getItemsByCategory error", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message || err 
    });
  }
};

// Get items by sub-category (optional)
exports.getItemsBySubCategory = async (req, res) => {
  try {
    const { subCategory } = req.params;
    const [rows] = await query(
      "SELECT * FROM items WHERE item_sub_category = ? ORDER BY item_name",
      [subCategory]
    );
    res.json(rows);
  } catch (err) {
    console.error("getItemsBySubCategory error", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message || err 
    });
  }
};
