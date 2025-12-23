// routes/poTrackingRoutes.js
const express = require("express");
const router = express.Router();
const poTracking = require("../controllers/poTrackingController");

router.post("/", poTracking.createTrackingHandler);
router.get("/", poTracking.listTrackingHandler);
router.put("/:id", poTracking.updateTrackingMaterialQuantity);

module.exports = router;
