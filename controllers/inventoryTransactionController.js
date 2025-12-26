const inventoryTransactionModel = require("../models/inventoryTransactionsModel");
const inventoryModel = require("../models/inventoryModel");
/**
 * Create inventory transaction (INWARD)
 */
async function createInventoryTransaction(req, res) {
  try {
    // 🔹 multer gives file here
    console.log(req.body);
    if (!req.file) {
      return res.status(400).json({ message: "Challan image is required" });
    }

    // 🔹 Parse items JSON
    let items;
    try {
      items = JSON.parse(req.body.items);
    } catch (err) {
      return res.status(400).json({ message: "Invalid items format" });
    }

    const payload = {
      ...req.body,
      items,
      challan_image: req.file.filename, // store filename
    };

    // 🔴 Required field validation
    if (
      !payload.po_id ||
      !payload.vendor_id ||
      !payload.challan_number ||
      !payload.receiving_date ||
      !payload.receiver_name ||
      !payload.receiver_phone ||
      !payload.delivery_location ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return res.status(400).json({ message: "All fields required." });
    }

    // 🔹 Validate items
    for (const item of payload.items) {
      if (
        !item.id ||
        !item.quantity_issued ||
        Number(item.quantity_issued) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid item data",
        });
      }
    }

    const transaction =
      await inventoryTransactionModel.createInventoryTransaction(payload);

    return res.status(201).json({
      success: true,
      message: "Inventory transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Create Inventory Transaction Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getAllInventoryTransaction(req, res) {
  try {
    const data = await inventoryTransactionModel.getAllInventoryTransactions();

    return res.status(201).json({
      message: "Inventory transaction created successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createInventoryTransaction,
  getAllInventoryTransaction,
};
