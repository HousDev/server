const {
  findAllServiceOrders,
  findServiceOrderById,
  findServiceOrdersByVendor,
  createServiceOrder,
  updateServiceOrder,
  updateServiceOrderStatus,
  deleteServiceOrder,
} = require("../models/serviceOrderModel");

const { findByIdVendor } = require("../models/vendorModel");

/**
 * GET all Service Orders
 */
const getAllServiceOrders = async (req, res) => {
  try {
    const data = await findAllServiceOrders();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch service orders" });
  }
};

/**
 * GET Service Order by ID
 */
const getServiceOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await findServiceOrderById(id);

    if (!data.length) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json(data[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch service order" });
  }
};

/**
 * GET Service Orders by Vendor ID
 */
const getServiceOrdersByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const data = await findServiceOrdersByVendor(vendor_id);

    if (!data.length) {
      return res.status(404).json({ message: "No service orders found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch service orders" });
  }
};

/**
 * CREATE Service Order
 */
const createServiceOrderController = async (req, res) => {
  try {
    const payload = req.body;
    if (
      !payload.so_number ||
      !payload.vendor_id ||
      !payload.project_id ||
      !payload.building_id ||
      !payload.service_type_id ||
      !payload.so_date ||
      !payload.delivery_date ||
      !payload.created_by
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Validate Vendor
    const existingVendor = await findByIdVendor(payload.vendor_id);

    if (!existingVendor || !existingVendor.length) {
      return res.status(400).json({ message: "Invalid Vendor" });
    }

    const result = await createServiceOrder(payload);

    return res.status(201).json({
      message: "Service Order created successfully",
      status: "completed",
      success: true,
      // payload: payload,
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create service order" });
  }
};

/**
 * UPDATE Service Order
 */
const updateServiceOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!id) {
      return res.status(400).json({ message: "Service Order ID required" });
    }

    const result = await updateServiceOrder(id, payload);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json({
      message: "Service Order updated successfully",
      status: "completed",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update service order" });
  }
};

/**
 * UPDATE Service Order Status (draft / approve / authorize / reject)
 */
const updateServiceOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "ID and status are required" });
    }

    const result = await updateServiceOrderStatus(id, status);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json({
      message: "Status updated successfully",
      status: "completed",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

/**
 * DELETE Service Order
 */
const deleteServiceOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteServiceOrder(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service order not found" });
    }

    return res.status(200).json({
      message: "Service Order deleted successfully",
      status: "completed",
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete service order" });
  }
};

module.exports = {
  getAllServiceOrders,
  getServiceOrderById,
  getServiceOrdersByVendor,
  createServiceOrderController,
  updateServiceOrderController,
  updateServiceOrderStatusController,
  deleteServiceOrderController,
};
