// backend/routes/services.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/service.controller");

// list
router.get("/", controller.listServices);

// helpers
router.get("/last-code", controller.getLastServiceCode);
router.get("/categories/categories", controller.getServiceCategories);
router.get("/categories/sub-categories", controller.getServiceSubCategories);

// filters
router.get("/category/:category", controller.getServicesByCategory);
router.get("/sub-category/:subCategory", controller.getServicesBySubCategory);

// crud
router.get("/:id", controller.getService);
router.post("/", controller.createService);
router.put("/:id", controller.updateService);
router.delete("/:id", controller.deleteService);
router.patch("/:id/toggle-active", controller.toggleActive);

// bulk import
router.post("/bulk-import-services", controller.importServices);

module.exports = router;
