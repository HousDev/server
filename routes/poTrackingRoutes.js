// routes/poTrackingRoutes.js
const express = require("express");
const router = express.Router();
const poTracking = require("../controllers/poTrackingController");
const upload = require("../middleware/upload");

router.post("/", poTracking.createTrackingHandler);
router.get("/", poTracking.listTrackingHandler);
router.put(
  "/:id",
  upload.single("challan_image"),
  poTracking.updateTrackingMaterialQuantity
);

module.exports = router;
