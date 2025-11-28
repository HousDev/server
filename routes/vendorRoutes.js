// routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/vendorController");

// list + search
router.get("/", controller.getVendors);

// single
router.get("/:id", controller.getVendorById);

// create
router.post("/", controller.createVendor);

// update
router.put("/:id", controller.updateVendor);

// delete
router.delete("/:id", controller.deleteVendor);

module.exports = router;
