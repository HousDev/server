const express = require("express");
const {
  getAllServiceOrders,
  getServiceOrderById,
  getServiceOrdersByVendor,
  createServiceOrderController,
  updateServiceOrderController,
  updateServiceOrderStatusController,
  deleteServiceOrderController,
  getServiceOrderServicesById,
  deleteServiceOrderServiceController,
  getAllServiceOrderTracking,
} = require("../controllers/serviceOrderController");

const { next } = require("../controllers/soSequenceController");

const serviceOrdersRouter = express.Router();

serviceOrdersRouter.get("/next", next);

/**
 * GET
 */
serviceOrdersRouter.get("/", getAllServiceOrders);
serviceOrdersRouter.get("/service-order-tracking", getAllServiceOrderTracking);

serviceOrdersRouter.get(
  "/service-order-services/:id",
  getServiceOrderServicesById,
);

serviceOrdersRouter.get("/vendor/:vendor_id", getServiceOrdersByVendor);
serviceOrdersRouter.get("/:id", getServiceOrderById);

/**
 * POST
 */
serviceOrdersRouter.post("/", createServiceOrderController);

/**
 * PUT
 */
serviceOrdersRouter.put("/:id", updateServiceOrderController);
serviceOrdersRouter.put("/status/:id", updateServiceOrderStatusController);

/**
 * DELETE SERVICE
 */
serviceOrdersRouter.delete(
  "/serviceOrderService/:soId/:service_id",
  deleteServiceOrderServiceController,
);

/**
 * DELETE
 */
serviceOrdersRouter.delete("/:id", deleteServiceOrderController);

module.exports = serviceOrdersRouter;
