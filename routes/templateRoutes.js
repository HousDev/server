const express = require("express");
const router = express.Router();

const {
  downloadProjectTemplate,
  downloadItemsExcelTemplate,
  downloadServicesExcelTemplate,
} = require("../controllers/templateController");

/**
 * Template download routes
 */

router.get("/project-import", downloadProjectTemplate);
router.get("/items-import-template", downloadItemsExcelTemplate);
router.get("/services-import-template", downloadServicesExcelTemplate);

module.exports = router;
