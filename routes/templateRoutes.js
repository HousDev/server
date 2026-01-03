const express = require("express");
const router = express.Router();

const {
  downloadProjectTemplate,
} = require("../controllers/templateController");

/**
 * Template download routes
 */

router.get("/project-import", downloadProjectTemplate);

module.exports = router;
