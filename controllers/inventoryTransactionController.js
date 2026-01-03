const inventoryTransactionModel = require("../models/inventoryTransactionsModel");
const inventoryModel = require("../models/inventoryModel");
/**
 * Create inventory transaction (INWARD)
 */
async function createInventoryTransaction(req, res) {
  try {
    // 🔹 multer gives file here

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
      challan_image: req.file?.filename || "", // store filename
    };

    // 🔴 Required field validation
    if (
      !payload.po_id ||
      !payload.vendor_id ||
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
      if (!item.id || Number(item.quantity_issued) < 0) {
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

async function createInventoryTransactionOut(req, res) {
  try {
    // 🔹 Parse items JSON
    let items = req.body.materials;

    const payload = {
      ...req.body,
      items,
    };

    // 🔴 Required field validation
    if (
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
      if (!item.materialId || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid item data",
        });
      }
    }

    const transaction =
      await inventoryTransactionModel.createInventoryTransactionOut(payload);

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

async function createInventoryTransactionIssueMaterial(req, res) {
  console.log(req.body);
  try {
    // 🔹 Parse items JSON
    let items = req.body.materials;

    const payload = {
      ...req.body,
      items,
    };

    // 🔴 Required field validation
    if (
      !payload.projectId ||
      !payload.buildingId ||
      !payload.floorId ||
      !payload.vendorId ||
      !payload.receiver_name ||
      !payload.receiver_number ||
      !payload.issue_date ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return res.status(400).json({ message: "All fields required." });
    }

    // 🔹 Validate items
    for (const item of payload.items) {
      if (!item.materialId || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid item data",
        });
      }
    }

    const transaction =
      await inventoryTransactionModel.createInventoryTransactionIssueMaterial(
        payload
      );
    console.log(transaction);

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
    const rows = await inventoryTransactionModel.getAllInventoryTransactions();
    const transactionMap = new Map();

    rows.forEach((row) => {
      if (!transactionMap.has(row.transaction_id)) {
        transactionMap.set(row.transaction_id, {
          transaction_id: row.transaction_id,
          po_id: row.po_id,
          vendor_id: row.vendor_id,
          po_number: row.po_number,
          vender_name: row.name,
          challan_number: row.challan_number,
          challan_image: row.challan_image,
          receiving_date: row.receiving_date,
          receiver_name: row.receiver_name,
          receiver_phone: row.receiver_phone,
          trasaction_type: row.trasaction_type,
          delivery_location: row.delivery_location,
          created_at: row.created_at,
          remark: row.remark,
          items: [], // 👈 important
        });
      }

      // Push items only if exists
      if (row.transaction_item_id) {
        transactionMap.get(row.transaction_id).items.push({
          transaction_item_id: row.transaction_item_id,
          item_id: row.item_id,
          item_name: row.item_name,
          quantity_issued: row.quantity_issued,
          initial_quantity: row.initial_quantity,
        });
      }
    });

    return res.status(200).json({
      message: "Inventory transactions fetched successfully",
      data: Array.from(transactionMap.values()),
    });
  } catch (error) {
    console.error("getAllInventoryTransaction error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

const getAllIssueMaterialInventoryTransaction = async (req, res) => {
  try {
    const rows =
      await inventoryTransactionModel.getAllIssueMaterialTransactions();

    const transactionsMap = new Map();

    rows.forEach((row) => {
      if (!transactionsMap.has(row.transaction_id)) {
        transactionsMap.set(row.transaction_id, {
          transaction_id: row.transaction_id,
          issue_date: row.issue_date,
          purpose: row.purpose,
          receiver_name: row.receiver_name,
          receiver_number: row.receiver_number,

          project_name: row.project_name,
          building_name: row.building_name,
          floor_name: row.floor_name,

          flat_name: row.flat_name,
          common_area_name: row.common_area_name,

          vendor_name: row.vendor_name,

          items: [], // 👈 important
        });
      }

      transactionsMap.get(row.transaction_id).items.push({
        transaction_item_id: row.transaction_item_id,
        item_name: row.item_name,
        quantity_issued: row.quantity_issued,
        initial_quantity: row.initial_quantity,
      });
    });

    res.status(200).json(Array.from(transactionsMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

module.exports = {
  createInventoryTransaction,
  getAllInventoryTransaction,
  createInventoryTransactionOut,
  createInventoryTransactionIssueMaterial,
  getAllIssueMaterialInventoryTransaction,
};
