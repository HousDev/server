const express = require("express");
const router = express.Router();
const controller = require("../controllers/securitySettings.controller");

// Security settings routes
router.get("/", controller.getSecuritySettings);
router.put("/", controller.updateSecuritySettings);
router.post("/reset", controller.resetSecuritySettings);
router.post("/validate-punch", controller.validatePunchLocation);

module.exports = router;