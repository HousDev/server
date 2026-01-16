const poPaymentModel = require("../models/poPaymentModel");

/**
 * Create PO Payment
 * (USER + ADMIN)
 */
exports.createPayment = async (req, res) => {
  try {
    const {
      po_id,
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
    console.log(req.body);
    // 🔍 Inline validation
    if (!po_id) {
      return res.status(400).json({ message: "po_id is required" });
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
      return res.status(400).json({ message: "Invalid upload payment proof." });
    }

    if (
      status &&
      !["PENDING", "SUCCESS", "FAILED", "CANCELLED"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const paymentId = await poPaymentModel.createPayment({
      po_id,
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status,
      remarks,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment_id: paymentId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create payment" });
  }
};

/**
 * Get all payments
 * (ADMIN only)
 */
exports.getPayments = async (req, res) => {
  try {
    const payments = await poPaymentModel.getPayments();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

/**
 * Update payment (full update)
 * (ADMIN only)
 */
exports.updatePayment = async (req, res) => {
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

    // 🔍 Inline validation
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

    const affectedRows = await poPaymentModel.updatePayment(id, {
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
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update payment" });
  }
};

/**
 * Delete payment
 * (ADMIN only)
 */
exports.deletePayment = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Payment id is required" });
    }

    const affectedRows = await poPaymentModel.deletePayment(id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete payment" });
  }
};
