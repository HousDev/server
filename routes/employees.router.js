// // backend/routes/hrmsEmployees.routes.js
// const express = require("express");
// const router = express.Router();
// const controller = require("../controllers/employees.controller");

// router.get("/", controller.getAllEmployees);
// router.get("/:id", controller.getEmployeeById);
// router.get("/email/:email", controller.getEmployeeByEmail);
// router.post("/", controller.createEmployee);
// router.post("/create-from-user", controller.createEmployeeFromUser); // NEW ROUTE

// router.put("/:id", controller.updateEmployee);
// router.delete("/:id", controller.deleteEmployee);

// module.exports = router;



// backend/routes/hrmsEmployees.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/employees.controller");

// CRUD Routes
router.get("/", controller.getAllEmployees);
router.get("/:id", controller.getEmployeeById);
router.get("/email/:email", controller.getEmployeeByEmail);
router.post("/", controller.createEmployee);
router.post("/create-from-user", controller.createEmployeeFromUser);
router.put("/:id", controller.updateEmployee);
router.patch("/:id/additional-details", controller.updateAdditionalDetails); // New route for additional details
router.delete("/:id", controller.deleteEmployee);

module.exports = router;