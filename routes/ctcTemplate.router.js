const express = require("express");
const router = express.Router();
const controller = require("../controllers/ctcTemplate.controller");

router.get("/set-default/:template_id", controller.setDefaultTemplate);
router.get("/set-active/:template_id", controller.toggleActiveTemplate);
router.post("/", controller.createTemplate);
router.put("/:template_id", controller.updateTemplate);
router.get("/", controller.getAllTemplates);
router.get("/:template_id", controller.getTemplate);
router.delete("/:template_id", controller.deleteTemplate);

module.exports = router;
