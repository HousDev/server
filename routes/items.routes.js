// backend/routes/items.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/items.controller");

router.get("/", controller.listItems);
router.get("/:id", controller.getItem);
router.post("/", controller.createItem);
router.put("/:id", controller.updateItem);
router.delete("/:id", controller.deleteItem);
router.patch("/:id/toggle-active", controller.toggleActive);

module.exports = router;
