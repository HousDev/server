const express = require("express");
const router = express.Router();

const woBillsController = require("../controllers/woBillController");

/**
 * Create Bill
 */
router.post("/", woBillsController.createWoBill);

/**
 * Get All Bills
 */
router.get("/", woBillsController.getAllWoBills);

/**
 * Get Bills By Work Order
 */
router.get("/work-order/:wo_id", woBillsController.getBillsByWoId);

/**
 * Get Bill By ID
 */
router.get("/:id", woBillsController.getWoBillById);

/**
 * Update Bill
 */
router.put("/:id", woBillsController.updateWoBill);

/**
 * Delete Bill
 */
router.delete("/:id", woBillsController.deleteWoBill);

module.exports = router;
