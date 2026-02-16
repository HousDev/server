const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeReimbursement.controller");

// Create reimbursement
router.post("/", controller.createRequest);

// Update (only if pending)
router.put("/:id", controller.updateRequest);

// Approve
router.put("/:id/approve", controller.approveRequest);

// Reject
router.put("/:id/reject", controller.rejectRequest);

// Mark as paid
router.put("/:id/paid", controller.markAsPaid);

// Get employee reimbursements
router.get("/employee/:employee_id", controller.getByEmployee);

// Get approved (payroll use)
router.get("/approved/list", controller.getApproved);

// Get single
router.get("/:id", controller.getById);

router.delete("/:id", controller.deleteById);

module.exports = router;
