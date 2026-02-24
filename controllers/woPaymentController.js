const woPaymentModel = require("../models/wo_payments");

/**
 * Create WO Payment
 * (USER + ADMIN)
 */
exports.createWoPayment = async (req, res) => {
  try {
    const {
      wo_id,
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status,
      remarks,
      created_by,
    } = req.body;
     console.log(req.body,"body")
    // 🔍 Inline Validation

    if (!wo_id) {
      return res.status(400).json({ message: "wo_id is required" });
    }

   

    if (!amount_paid || Number(amount_paid) <= 0) {
      return res
        .status(400)
        .json({ message: "amount_paid must be greater than 0" });
    }

    if (!payment_method) {
      return res.status(400).json({ message: "payment_method is required" });
    }

    if (!payment_date) {
      return res.status(400).json({ message: "payment_date is required" });
    }

    if (transaction_type && !["PAYMENT", "REFUND"].includes(transaction_type)) {
      return res.status(400).json({ message: "Invalid transaction_type" });
    }

    if (!payment_proof || payment_proof.length === 0) {
      return res.status(400).json({
        message: "Invalid upload payment proof.",
      });
    }

    if (
      status &&
      !["PENDING", "SUCCESS", "FAILED", "CANCELLED"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await woPaymentModel.createWoPayment({
      wo_id,
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof: "/uploads/" + payment_proof,
      payment_date,
      status,
      remarks,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: "WO Payment created successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Failed to create WO payment",
    });
  }
};

/**
 * Get All WO Payments
 * (ADMIN only)
 */
exports.getWoPayments = async (req, res) => {
  try {
    const payments = await woPaymentModel.getWoPayments();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch WO payments",
    });
  }
};

/**
 * Get WO Payment History
 * (ADMIN only)
 */
exports.getWoPaymentsHistory = async (req, res) => {
  try {
    const payments = await woPaymentModel.getWoPaymentsHistory();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch WO payment history",
    });
  }
};

/**
 * Update WO Payment
 * (ADMIN only)
 */
exports.updateWoPayment = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;

    const {
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status,
      remarks,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Payment id is required" });
    }

    if (transaction_type && !["PAYMENT", "REFUND"].includes(transaction_type)) {
      return res.status(400).json({ message: "Invalid transaction_type" });
    }

    if (amount_paid !== undefined && Number(amount_paid) <= 0) {
      return res
        .status(400)
        .json({ message: "amount_paid must be greater than 0" });
    }

    if (
      status &&
      !["PENDING", "SUCCESS", "FAILED", "CANCELLED"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const affectedRows = await woPaymentModel.updateWoPayment(id, {
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status,
      remarks,
    });

    if (!affectedRows) {
      return res.status(404).json({ message: "WO Payment not found" });
    }

    res.json({ message: "WO Payment updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update WO payment",
    });
  }
};

/**
 * Delete WO Payment
 * (ADMIN only)
 */
exports.deleteWoPayment = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Payment id is required" });
    }

    const affectedRows = await woPaymentModel.deleteWoPayment(id);

    if (!affectedRows) {
      return res.status(404).json({ message: "WO Payment not found" });
    }

    res.json({ message: "WO Payment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to delete WO payment",
    });
  }
};
