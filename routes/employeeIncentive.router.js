const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeIncentive.controller");

// Create incentive
router.post("/", controller.createIncentive);

// Approve
router.put("/:id/approve", controller.approveIncentive);

// Reject
router.put("/:id/reject", controller.rejectIncentive);

// Mark as paid
router.put("/:id/paid", controller.markAsPaid);

// Get employee incentives
router.get("/employee/:employee_id", controller.getByEmployee);

// Get payroll month incentives
router.get("/month/:month/year/:year", controller.getByMonthYear);

// Get single incentive
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.delete("/:id", controller.deleteIncentive);

module.exports = router;
