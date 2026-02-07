const express = require("express");
const router = express.Router();
const controller = require("../controllers/companyController");

// Get all companies
router.get("/", controller.getCompanies);

// Get single company
router.get("/:id", controller.getCompanyById);

// Create company
router.post("/", controller.createCompany);

// Update company
router.put("/:id", controller.updateCompany);

// Delete company (soft delete)
router.delete("/:id", controller.deleteCompany);

// Get company office locations
router.get("/:id/locations", controller.getCompanyLocations);

router.get("/office-location/:id", controller.getCompanyLocationById);

// Create office location
router.post("/:id/locations", controller.createOfficeLocation);

// Update office location
router.put("/locations/:id", controller.updateOfficeLocation);

// Delete office location
router.delete("/locations/:id", controller.deleteOfficeLocation);

module.exports = router;
