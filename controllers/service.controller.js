// backend/controllers/services.controller.js
const Services = require("../models/services.model");
const { query } = require("../config/db");

/* ---------------- list ---------------- */

exports.listServices = async (req, res) => {
  try {
    const rows = await Services.findAll();
    res.json(rows);
  } catch (err) {
    console.error("listServices error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

/* ---------------- get by id ---------------- */

exports.getService = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const service = await Services.findById(id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (err) {
    console.error("getService error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

/* ---------------- create ---------------- */

exports.createService = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.service_code || !payload.service_name || !payload.unit) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // check duplicate service code
    const existing = await Services.findByCode(payload.service_code);
    if (existing) {
      return res.status(409).json({ message: "Service code already exists" });
    }

    const created = await Services.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("createService error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

/* ---------------- update ---------------- */

exports.updateService = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body;

    // if updating service_code, ensure uniqueness
    if (payload.service_code) {
      const found = await Services.findByCode(payload.service_code);
      if (found && found.id !== id) {
        return res.status(409).json({ message: "Service code already exists" });
      }
    }

    const updated = await Services.update(id, payload);
    if (!updated) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("updateService error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

/* ---------------- delete ---------------- */

exports.deleteService = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ok = await Services.remove(id);

    if (!ok) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteService error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

/* ---------------- toggle active ---------------- */

exports.toggleActive = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await Services.toggleActive(id);

    if (!updated) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("toggleActive error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

/* ---------------- import services ---------------- */

exports.importServices = async (req, res) => {
  try {
    const services = req.body;

    if (!Array.isArray(services) || !services.length) {
      return res.status(400).json({ message: "Invalid services data" });
    }

    const sql = `
      INSERT INTO services (
        service_code,
        service_name,
        category,
        service_category,
        service_sub_category,
        description,
        unit,
        igst_rate,
        cgst_rate,
        sgst_rate,
        standard_rate,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const service of services) {
      const values = [
        service.service_code,
        service.service_name,
        service.category || "service",
        service.service_category || null,
        service.service_sub_category || null,
        service.description || null,
        service.unit || "nos",
        service.igst_rate ?? 18,
        service.cgst_rate ?? 9,
        service.sgst_rate ?? 9,
        service.standard_rate ?? 0,
        service.is_active ?? 1,
      ];

      await query(sql, values);
    }

    res.json({
      success: true,
      inserted: services.length,
    });
  } catch (err) {
    console.error("importServices error", err);
    res.status(500).json({ message: "Failed to import services" });
  }
};

/* ---------------- helpers ---------------- */

exports.getLastServiceCode = async (req, res) => {
  try {
    const rows = await query(`
      SELECT service_code
      FROM services
      ORDER BY id DESC
      LIMIT 1
    `);

    if (!rows.length) {
      return res.json({ lastServiceCode: "SER0000" });
    }

    res.json({ lastServiceCode: rows[0].service_code });
  } catch (err) {
    console.error("getLastServiceCode error", err);
    res.status(500).json({ message: "Failed to fetch last service code" });
  }
};

exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Services.getServiceCategories();
    res.json(categories);
  } catch (err) {
    console.error("getServiceCategories error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

exports.getServiceSubCategories = async (req, res) => {
  try {
    const subCategories = await Services.getServiceSubCategories();
    res.json(subCategories);
  } catch (err) {
    console.error("getServiceSubCategories error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const services = await Services.findByCategory(category);
    res.json(services);
  } catch (err) {
    console.error("getServicesByCategory error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};

exports.getServicesBySubCategory = async (req, res) => {
  try {
    const { subCategory } = req.params;
    const rows = await query(
      "SELECT * FROM services WHERE service_sub_category = ? ORDER BY service_name",
      [subCategory],
    );
    res.json(rows);
  } catch (err) {
    console.error("getServicesBySubCategory error", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};
