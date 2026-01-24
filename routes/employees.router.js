// backend/routes/hrmsEmployees.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/employees.controller");

router.get("/", controller.getAllEmployees);
router.get("/:id", controller.getEmployeeById);
router.get("/email/:email", controller.getEmployeeByEmail);
router.post("/", controller.createEmployee);
router.post("/create-from-user", controller.createEmployeeFromUser); // NEW ROUTE

router.put("/:id", controller.updateEmployee);
router.delete("/:id", controller.deleteEmployee);

module.exports = router;
