// controllers/woPaymentsHistoryController.js

const { query } = require("../config/db");
const woPaymentsModel = require("../models/woPaymentHistory.Model");

/**
 * CREATE Payment
 */
exports.createPayment = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      payment_proof: "/uploads/" + req.file.filename,
    };

    const existingWO = await query(
      "SELECT * FROM service_orders WHERE id = ?",
      [payload.wo_id],
    );

    if (!existingWO) {
      return res.status(400).json({ message: "Wrok Worder Not Found." });
    }

    if (Number(payload.amount_paid) <= 0) {
      return res
        .status(400)
        .json({ message: "Amount paid must be greater than 0." });
    }

    const result = await woPaymentsModel.createWoPayment(payload);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
};

/**
 * GET All Payments
 */
exports.getAllPaymentsHistory = async (req, res) => {
  try {
    const data = await woPaymentsModel.getWoPaymentsHistory();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

/**
 * GET Payment By ID
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await woPaymentsModel.findPaymentById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Payment By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

/**
 * UPDATE Payment
 */
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;

    await woPaymentsModel.updatePayment(id, req.body);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("Update Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: error.message,
    });
  }
};

/**
 * DELETE Payment
 */
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    await woPaymentsModel.deletePayment(id);

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};
