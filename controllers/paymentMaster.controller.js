const PaymentMasterModel = require("../models/paymentMaster.model");

/**
 * GET /payment-masters
 */
async function getAllActivePaymentMasters(req, res) {
  try {
    const paymentMasters =
      await PaymentMasterModel.findAllActivePaymentMasters();

    res.status(200).json({
      success: true,
      data: paymentMasters,
    });
  } catch (error) {
    console.error("Get payment masters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment masters",
    });
  }
}

async function getAllPaymentMasters(req, res) {
  try {
    const paymentMasters = await PaymentMasterModel.findAllPaymentMasters();

    res.status(200).json({
      success: true,
      data: paymentMasters,
    });
  } catch (error) {
    console.error("Get payment masters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment masters",
    });
  }
}

/**
 * GET /payment-masters/:id
 */
async function getPaymentMasterById(req, res) {
  try {
    const { id } = req.params;

    const paymentMaster = await PaymentMasterModel.findPaymentMasterById(id);

    if (!paymentMaster) {
      return res.status(404).json({
        success: false,
        message: "Payment master not found",
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMaster,
    });
  } catch (error) {
    console.error("Get payment master error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment master",
    });
  }
}

/**
 * POST /payment-masters
 */
async function createPaymentMaster(req, res) {
  try {
    const {
      event_trigger,
      percentPayment,
      firstText,
      materialPercent,
      secondText,
      gracePeriod,
      thirdText,
    } = req.body;

    // basic validation
    if (!event_trigger || percentPayment == null || !firstText) {
      return res.status(400).json({
        success: false,
        message: "event_trigger, percentPayment and firstText are required",
      });
    }

    // material trigger validation
    if (event_trigger === "Material" && materialPercent == null) {
      return res.status(400).json({
        success: false,
        message: "materialPercent is required for Material trigger",
      });
    }

    const paymentMaster = await PaymentMasterModel.createPaymentMaster({
      event_trigger,
      percentPayment,
      firstText,
      materialPercent,
      secondText,
      gracePeriod,
      thirdText,
    });

    res.status(201).json({
      success: true,
      message: "Payment master created successfully",
      data: paymentMaster,
    });
  } catch (error) {
    console.error("Create payment master error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment master",
    });
  }
}

/**
 * PUT /payment-masters/:id
 */
async function updatePaymentMaster(req, res) {
  try {
    const { id } = req.params;

    const updated = await PaymentMasterModel.updatePaymentMaster(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Payment master not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment master updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update payment master error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment master.",
    });
  }
}

/**
 * PATCH /payment-masters/:id/toggle-active
 */
async function togglePaymentMasterStatus(req, res) {
  try {
    const { id } = req.params;

    const result = await PaymentMasterModel.togglePaymentMasterStatus(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment master not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment master status updated",
    });
  } catch (error) {
    console.error("Toggle payment master status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment master status",
    });
  }
}

/**
 * DELETE /payment-masters/:id
 */
async function deletePaymentMaster(req, res) {
  try {
    const { id } = req.params;

    const result = await PaymentMasterModel.deletePaymentMaster(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment master not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment master deleted successfully",
    });
  } catch (error) {
    console.error("Delete payment master error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment master",
    });
  }
}

async function bulkTogglePaymentMasterStatus(req, res) {
  try {
    let { ids } = req.body;

    // 🔥 FIX: parse if ids comes as string
    if (typeof ids === "string") {
      ids = JSON.parse(ids);
    }

    // 🔥 FIX: force number array
    ids = ids.map(Number);

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({
        success: false,
        message: "ids array is required",
      });
    }

    const result = await PaymentMasterModel.toggleBulkPaymentMasterStatus(ids);

    res.status(200).json({
      success: true,
      message: "Payment masters status updated",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Bulk toggle error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment masters",
    });
  }
}

async function bulkDeletePaymentMasters(req, res) {
  try {
    let { ids } = req.body;
    console.log(ids);

    // Handle string case: "[3,4]"
    if (typeof ids === "string") {
      ids = JSON.parse(ids);
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids array is required",
      });
    }

    // Convert to numbers & remove invalid values
    ids = ids.map(Number).filter((id) => Number.isInteger(id));

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message: "No valid ids provided",
      });
    }

    const result = await PaymentMasterModel.deleteBulkPaymentMasters(ids);

    res.status(200).json({
      success: true,
      message: "Payment masters deleted successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment masters",
    });
  }
}

module.exports = {
  getAllActivePaymentMasters,
  bulkTogglePaymentMasterStatus,
  bulkDeletePaymentMasters,
  getAllPaymentMasters,
  getPaymentMasterById,
  createPaymentMaster,
  updatePaymentMaster,
  togglePaymentMasterStatus,
  deletePaymentMaster,
};
