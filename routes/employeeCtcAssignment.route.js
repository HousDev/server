const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeCtcAssignment.controller");

// Assign template to employee
router.post("/", controller.assignTemplate);

// Assign template to employee
router.get("/", controller.getAllAsiignUserTemplate);

// Update assignment
router.put("/:id", controller.updateAssignment);

// Get current CTC of employee
router.get("/employee/:employee_id", controller.getByEmployee);

// Get full history of employee
router.get("/employee/:employee_id/history", controller.getHistoryByEmployee);

// Delete assignment
router.delete("/:id", controller.deleteAssignment);

module.exports = router;
