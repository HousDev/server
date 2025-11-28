// backend/routes/serviceOrders.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceOrderController");

router.get("/", controller.list);
router.get("/:id", controller.get);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

// bulk actions
router.post("/bulk/status", controller.bulkStatus);
router.post("/bulk/delete", controller.bulkDelete);

module.exports = router;
