const express = require("express");
const router = express.Router();
const controller = require("../controllers/ctcTemplate.controller");

router.post("/", controller.createTemplate);
router.put("/:template_id", controller.updateTemplate);
router.get("/", controller.getAllTemplates);
router.get("/:template_id", controller.getTemplate);
router.delete("/:template_id", controller.deleteTemplate);

module.exports = router;
