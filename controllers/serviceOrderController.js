// backend/controllers/serviceOrders.controller.js
const ServiceOrders = require("../models/serviceOrderModel");

// helper: treat numbers or numeric-strings like "12" as numeric
const isNumericLike = (v) =>
  (typeof v === "number" && Number.isFinite(v)) ||
  (typeof v === "string" && /^\d+$/.test(v));

// list
exports.list = async (req, res) => {
  try {
    const { q } = req.query;
    if (q) {
      const rows = await ServiceOrders.findByFilter(q);
      return res.json(rows);
    }
    const rows = await ServiceOrders.findAll();
    res.json(rows);
  } catch (err) {
    console.error("serviceOrders.list error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

// get by id
exports.get = async (req, res) => {
  try {
    const id = req.params.id;
    const so = await ServiceOrders.findById(id);
    if (!so)
      return res.status(404).json({ message: "Service order not found" });
    res.json(so);
  } catch (err) {
    console.error("serviceOrders.get error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

// create
exports.create = async (req, res) => {
  try {
    const payload = req.body || {};

    // basic validations
    if (
      !payload.service_name ||
      payload.vendor_id === undefined ||
      payload.project_id === undefined
    ) {
      return res
        .status(400)
        .json({
          message: "service_name, vendor_id and project_id are required",
        });
    }

    // optional uniqueness check for so_number
    if (payload.so_number) {
      const existing = await ServiceOrders.findBySoNumber(payload.so_number);
      if (existing) {
        return res.status(409).json({ message: "SO number already exists" });
      }
    }

    // remove any client-provided id (DB will auto-generate)
    const createPayload = { ...payload };
    if (createPayload.id) delete createPayload.id;

    // Validate numeric FKs (accept numeric strings like "2")
    if (
      !isNumericLike(createPayload.vendor_id) ||
      !isNumericLike(createPayload.project_id)
    ) {
      return res
        .status(400)
        .json({ message: "vendor_id and project_id must be numeric IDs" });
    }
    if (
      createPayload.service_type_id &&
      !isNumericLike(createPayload.service_type_id)
    ) {
      return res
        .status(400)
        .json({ message: "service_type_id must be numeric if provided" });
    }

    // convert numeric-like strings to numbers (optional but useful)
    createPayload.vendor_id = Number(createPayload.vendor_id);
    createPayload.project_id = Number(createPayload.project_id);
    if (
      createPayload.service_type_id !== undefined &&
      createPayload.service_type_id !== null &&
      createPayload.service_type_id !== ""
    ) {
      createPayload.service_type_id = Number(createPayload.service_type_id);
    } else {
      createPayload.service_type_id = null;
    }

    if (!createPayload.created_at) createPayload.created_at = new Date();

    const created = await ServiceOrders.create(createPayload);
    return res.status(201).json(created);
  } catch (err) {
    console.error("serviceOrders.create error", err);
    // if model threw a validation-style error, surface it as 400
    if (
      err &&
      err.message &&
      /vendor_id|project_id|service_type_id/i.test(err.message)
    ) {
      return res.status(400).json({ message: err.message });
    }
    return res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

// update
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};

    // if updating so_number, ensure uniqueness
    if (payload.so_number) {
      const found = await ServiceOrders.findBySoNumber(payload.so_number);
      if (found && String(found.id) !== String(id)) {
        return res.status(409).json({ message: "SO number already exists" });
      }
    }

    // If payload includes vendor/project/service_type, validate numeric-like
    if (payload.vendor_id !== undefined && !isNumericLike(payload.vendor_id)) {
      return res.status(400).json({ message: "vendor_id must be numeric" });
    }
    if (
      payload.project_id !== undefined &&
      !isNumericLike(payload.project_id)
    ) {
      return res.status(400).json({ message: "project_id must be numeric" });
    }
    if (
      payload.service_type_id !== undefined &&
      payload.service_type_id !== null &&
      !isNumericLike(payload.service_type_id)
    ) {
      return res
        .status(400)
        .json({ message: "service_type_id must be numeric" });
    }

    // optionally convert numeric-like strings to numbers before update
    const updatePayload = { ...payload };
    if (
      updatePayload.vendor_id !== undefined &&
      updatePayload.vendor_id !== null &&
      updatePayload.vendor_id !== ""
    ) {
      updatePayload.vendor_id = Number(updatePayload.vendor_id);
    }
    if (
      updatePayload.project_id !== undefined &&
      updatePayload.project_id !== null &&
      updatePayload.project_id !== ""
    ) {
      updatePayload.project_id = Number(updatePayload.project_id);
    }
    if (
      updatePayload.service_type_id !== undefined &&
      updatePayload.service_type_id !== null &&
      updatePayload.service_type_id !== ""
    ) {
      updatePayload.service_type_id = Number(updatePayload.service_type_id);
    }

    const updated = await ServiceOrders.update(id, updatePayload);
    if (!updated)
      return res.status(404).json({ message: "Service order not found" });
    res.json(updated);
  } catch (err) {
    console.error("serviceOrders.update error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

// delete
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const ok = await ServiceOrders.remove(id);
    if (!ok)
      return res.status(404).json({ message: "Service order not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("serviceOrders.delete error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

// bulk status update
exports.bulkStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }
    if (!status) return res.status(400).json({ message: "status required" });

    // ensure ids are numeric (convert numeric-strings too)
    const numericIds = ids
      .map((v) => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
        return null;
      })
      .filter((v) => v !== null);

    if (numericIds.length === 0) {
      return res.status(400).json({ message: "ids must contain numeric IDs" });
    }

    const affected = await ServiceOrders.bulkUpdateStatus(numericIds, status);
    res.json({ message: "Bulk status updated", affected });
  } catch (err) {
    console.error("serviceOrders.bulkStatus error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};

// bulk delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    const numericIds = ids
      .map((v) => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
        return null;
      })
      .filter((v) => v !== null);

    if (numericIds.length === 0) {
      return res.status(400).json({ message: "ids must contain numeric IDs" });
    }

    const affected = await ServiceOrders.bulkDelete(numericIds);
    res.json({ message: "Bulk delete completed", affected });
  } catch (err) {
    console.error("serviceOrders.bulkDelete error", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
};
