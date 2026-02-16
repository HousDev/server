const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeAdvance.controller");

// Create advance request
router.post("/", controller.createRequest);

// Approve
router.put("/:id/approve", controller.approveAdvance);

// Reject
router.put("/:id/reject", controller.rejectAdvance);

// Mark disbursed (start recovery)
router.put("/:id/disburse", controller.markDisbursed);

// Get single advance
router.get("/:id", controller.getById);

// Get all advances of employee
router.get("/employee/:employee_id", controller.getByEmployee);

// Close advance
router.put("/:id/close", controller.closeAdvance);

module.exports = router;
