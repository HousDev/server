// backend/routes/items.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/items.controller");

router.get("/", controller.listItems);
router.get("/last-code", controller.getLastItemCode);
router.get("/:id", controller.getItem);
router.post("/", controller.createItem);
router.put("/:id", controller.updateItem);
router.delete("/:id", controller.deleteItem);
router.patch("/:id/toggle-active", controller.toggleActive);
router.post("/bulk-import-items", controller.importItems);
router.get("/last-code", controller.getLastItemCode);
router.get("/categories/categories", controller.getItemCategories);
router.get("/categories/sub-categories", controller.getItemSubCategories);
router.get("/category/:category", controller.getItemsByCategory);
router.get("/sub-category/:subCategory", controller.getItemsBySubCategory); // 
module.exports = router;
