const express = require("express");
const router = express.Router();

const {
  downloadProjectTemplate,
  downloadItemsExcelTemplate,
} = require("../controllers/templateController");

/**
 * Template download routes
 */

router.get("/project-import", downloadProjectTemplate);
router.get("/items-import-template", downloadItemsExcelTemplate);

module.exports = router;
