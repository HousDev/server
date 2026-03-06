const woBillsModel = require("../models/woBillsModel");

/**
 * Create Bill
 */
async function createWoBill(req, res) {
  try {
    const {
      wo_id,
      bill_number,
      bill_amount,
      bill_balance,
      bill_retention,
      bill_date,
      bill_due_date,
      bill_proof,
      created_by,
    } = req.body;

    if (!wo_id || !bill_proof || !created_by) {
      return res
        .status(400)
        .json({ message: "wo_id, bill_proof and created_by are required" });
    }

    const result = await woBillsModel.createWoBill(req.body);

    return res.status(201).json({
      message: "Bill created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Update Bill
 */
async function updateWoBill(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }

    const existing = await woBillsModel.findWoBillById(id);
    if (!existing) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await woBillsModel.updateWoBill(id, req.body);

    return res.json({ message: "Bill updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Delete Bill
 */
async function deleteWoBill(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }

    const existing = await woBillsModel.findWoBillById(id);
    if (!existing) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await woBillsModel.deleteWoBill(id);

    return res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get Bill By ID
 */
async function getWoBillById(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }

    const data = await woBillsModel.findWoBillById(id);

    if (!data) {
      return res.status(404).json({ message: "Bill not found" });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get Bills By Work Order
 */
async function getBillsByWoId(req, res) {
  try {
    const { wo_id } = req.params;

    if (!wo_id || isNaN(wo_id)) {
      return res.status(400).json({ message: "Invalid work order ID" });
    }

    const data = await woBillsModel.findBillsByWoId(wo_id);

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get All Bills
 */
async function getAllWoBills(req, res) {
  try {
    const data = await woBillsModel.findAllWoBills();

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createWoBill,
  updateWoBill,
  deleteWoBill,
  getWoBillById,
  getBillsByWoId,
  getAllWoBills,
};
