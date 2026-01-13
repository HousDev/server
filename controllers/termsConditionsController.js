const {
  findAllTC,
  findByIdTC,
  createTC,
  updateTC,
  deleteTC,
  findByIdVendorsTC,
  updateIs_DefaultTC,
} = require("../models/termsConditionsModel");

const { findByIdVendor } = require("../models/vendorModel");

/**
 * GET all terms & conditions
 */
const getAllTC = async (req, res) => {
  try {
    const data = await findAllTC();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch data" });
  }
};

/**
 * GET TC by ID
 */
const getTCById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await findByIdTC(id);

    if (!data.length) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.status(200).json(data[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch record" });
  }
};

const getTCByIdVendorTermsConditions = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await findByIdVendorsTC(id);

    if (!data.length) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch record" });
  }
};

/**
 * CREATE TC
 */
const createTCController = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.category || !payload.content) {
      return res.status(400).json({ message: "All fields required." });
    }
    const existingVendor = findByIdVendor(payload.vendor_id);
    if (!existingVendor) {
      return res.status(400).json({ message: "Invalid Vendor." });
    }
    const result = await createTC(payload);

    return res.status(201).json({
      message: "Terms & Conditions created successfully",
      status: "completed",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create record" });
  }
};

/**
 * UPDATE TC
 */
const updateTCController = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!id || !payload.category || !payload.content) {
      return res.status(400).json({ message: "All fields required." });
    }

    const result = await updateTC(id, payload);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res
      .status(200)
      .json({ message: "Updated successfully", status: "completed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update record" });
  }
};

const updateIs_DefaultTCController = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_default } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Faild To Set Default" });
    }

    const result = await updateIs_DefaultTC(id, is_default);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res
      .status(200)
      .json({ message: "Updated successfully", status: "completed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update record" });
  }
};

/**
 * DELETE TC
 */
const deleteTCController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTC(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res
      .status(200)
      .json({ message: "Deleted successfully", status: "completed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete record" });
  }
};

module.exports = {
  getAllTC,
  getTCById,
  createTCController,
  updateTCController,
  deleteTCController,
  getTCByIdVendorTermsConditions,
  updateIs_DefaultTCController,
};
