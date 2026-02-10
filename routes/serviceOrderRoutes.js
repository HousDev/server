const express = require("express");
const {
  getAllServiceOrders,
  getServiceOrderById,
  getServiceOrdersByVendor,
  createServiceOrderController,
  updateServiceOrderController,
  updateServiceOrderStatusController,
  deleteServiceOrderController,
} = require("../controllers/serviceOrderController");

const { next } = require("../controllers/soSequenceController");

const serviceOrdersRouter = express.Router();

serviceOrdersRouter.get("/next", next);

/**
 * GET
 */
serviceOrdersRouter.get("/", getAllServiceOrders);
serviceOrdersRouter.get("/:id", getServiceOrderById);
serviceOrdersRouter.get("/vendor/:vendor_id", getServiceOrdersByVendor);

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
 * DELETE
 */
serviceOrdersRouter.delete("/:id", deleteServiceOrderController);

module.exports = serviceOrdersRouter;
