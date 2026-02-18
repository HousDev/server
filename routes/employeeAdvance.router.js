const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeAdvance.controller");
const upload = require("../middleware/upload");

// Create advance request
router.post("/", upload.single("profile_picture"), controller.createRequest);

// Approve
router.put("/:id/approve", controller.approveAdvance);

// Reject
router.put("/:id/reject", controller.rejectAdvance);

// Mark disbursed (start recovery)
router.put("/:id/disburse", controller.markDisbursed);

// Get all advance
router.get("/", controller.getAll);

// Get single advance
router.get("/:id", controller.getById);

// Get all advances of employee
router.get("/employee/:employee_id", controller.getByEmployee);

// Close advance
router.put("/:id/close", controller.closeAdvance);

//Close
router.delete("/:id", controller.deleteAdvance);

module.exports = router;
