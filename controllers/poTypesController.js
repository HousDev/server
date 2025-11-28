const model = require("../models/poTypesModel");

async function getAll(req, res) {
  try {
    const rows = await model.getAll();
    res.json(rows);
  } catch (err) {
    console.error("po types getAll:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getById(req, res) {
  try {
    const row = await model.getById(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("po types getById:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function create(req, res) {
  try {
    const created = await model.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error("po types create:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  try {
    const updated = await model.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error("po types update:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  try {
    const result = await model.remove(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("po types delete:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getAll, getById, create, update, remove };
