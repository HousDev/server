const express = require("express");
const router = express.Router();

const woBillsController = require("../controllers/woBillController");
const upload = require("../middleware/upload");

/**
 * Create Bill
 */
router.post("/", upload.single("bill_proof"), woBillsController.createWoBill);

/**
 * Get All Bills
 */
router.get("/", woBillsController.getAllWoBills);
router.get("/:employeeId", woBillsController.getAllEmployeeWoBills);

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
router.put("/bill-status/:id", woBillsController.updateWoBillStatus);

router.put("/:id", woBillsController.updateWoBill);

/**
 * Delete Bill
 */
router.delete("/:id", woBillsController.deleteWoBill);

module.exports = router;
