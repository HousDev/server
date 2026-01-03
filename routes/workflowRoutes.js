const express = require("express");
const router = express.Router();

const flatController = require("../controllers/flatController");
const commonAreaController = require("../controllers/commonAreaController");

// Flat workflow routes
router.put("/flats/:flatId/workflow", flatController.updateFlatWorkflow); // Update entire workflow
router.put("/flats/:flatId/tasks/:taskId", flatController.updateFlatTask); // Update single task
router.get("/flats/:flatId", flatController.getFlat); // Get flat details
router.get("/floors/:floorId/flats", flatController.getFlatsByFloor); // Get all flats in floor

// Common area workflow routes
router.put(
  "/common-areas/:commonAreaId/workflow",
  commonAreaController.updateCommonAreaWorkflow
); // Update entire workflow
router.put(
  "/common-areas/:commonAreaId/tasks/:taskId",
  commonAreaController.updateCommonAreaTask
); // Update single task
router.get("/common-areas/:commonAreaId", commonAreaController.getCommonArea); // Get common area details
router.get(
  "/floors/:floorId/common-areas",
  commonAreaController.getCommonAreasByFloor
); // Get all common areas in floor

module.exports = router;
