// controllers/serviceTypesController.js
const serviceTypeModel = require("../models/serviceTypeModel");

async function getAll(req, res) {
  try {
    const onlyActive = req.query.active === "1";
    const rows = await serviceTypeModel.findAll({ onlyActive });
    return res.json(rows);
  } catch (err) {
    console.error("serviceTypes.getAll error", err);
    return res.status(500).json({ error: "internal" });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "invalid id" });
    const row = await serviceTypeModel.findById(id);
    if (!row) return res.status(404).json({ error: "not found" });
    return res.json(row);
  } catch (err) {
    console.error("serviceTypes.getById error", err);
    return res.status(500).json({ error: "internal" });
  }
}

async function create(req, res) {
  try {
    const { name, description, is_active, created_by } = req.body;
    if (!name || !name.toString().trim())
      return res.status(400).json({ error: "name required" });
    const result = await serviceTypeModel.create({
      name: name.toString().trim(),
      description,
      is_active,
      created_by,
    });
    return res.status(201).json({ id: result.id });
  } catch (err) {
    console.error("serviceTypes.create error", err);
    return res.status(500).json({ error: "internal" });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, is_active } = req.body;
    if (!id) return res.status(400).json({ error: "invalid id" });
    if (!name || !name.toString().trim())
      return res.status(400).json({ error: "name required" });
    const affected = await serviceTypeModel.update(id, {
      name: name.toString().trim(),
      description,
      is_active,
    });
    if (!affected) return res.status(404).json({ error: "not found" });
    return res.json({ id });
  } catch (err) {
    console.error("serviceTypes.update error", err);
    return res.status(500).json({ error: "internal" });
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "invalid id" });
    const affected = await serviceTypeModel.remove(id);
    if (!affected) return res.status(404).json({ error: "not found" });
    return res.json({ id, deleted: true });
  } catch (err) {
    console.error("serviceTypes.remove error", err);
    return res.status(500).json({ error: "internal" });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
