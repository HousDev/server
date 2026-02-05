const express = require("express");
const router = express.Router();
const controller = require("../controllers/paymentMaster.controller");

/**
 * GET /payment-masters
 */
router.get("/activeTerms", controller.getAllActivePaymentMasters);

router.get("/", controller.getAllPaymentMasters);

/**
 * GET /payment-masters/:id
 */
router.get("/:id", controller.getPaymentMasterById);

/**
 * POST /payment-masters
 */
router.post("/", controller.createPaymentMaster);

/**
 * PUT /payment-masters/:id
 */
router.put("/:id", controller.updatePaymentMaster);

/**
 * PATCH /payment-masters/:id/toggle-active
 */
router.patch("/:id/toggle-active", controller.togglePaymentMasterStatus);

// BULK DELETE
router.delete("/bulk-delete", controller.bulkDeletePaymentMasters);

/**
 * DELETE /payment-masters/:id
 */
router.delete("/:id", controller.deletePaymentMaster);

// BULK TOGGLE ACTIVE
router.patch("/bulk-toggle-active", controller.bulkTogglePaymentMasterStatus);

module.exports = router;
