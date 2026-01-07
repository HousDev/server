const { query } = require("../config/db");
const requestMaterialModel = require("../models/requestMaterialModel");

const generateRequestNo = async () => {
  try {
    // Get the last inserted ID from request_material
    const rows = await query(
      `SELECT id FROM request_material ORDER BY id DESC LIMIT 1`
    );

    // rows is an array of objects like [{ id: 5 }]
    const lastId = rows && rows.length > 0 ? Number(rows[0].id) : 0;

    const nextId = lastId + 1;

    const year = new Date().getFullYear();

    // Pad the ID to be at least 4 digits
    const paddedId = String(nextId).padStart(4, "0");

    const requestNo = `RM/${year}/${paddedId}`;

    return requestNo;
  } catch (err) {
    console.error("Generate Request No Error:", err);
    throw err;
  }
};

async function createRequestMaterial(req, res) {
  try {
    // 🔹 Parse materials
    const req_no = await generateRequestNo();
    let items = req.body.materials;

    const payload = {
      ...req.body,
      request_no: req_no,
      items,
    };
    console.log(payload);

    // 🔴 Required field validation
    if (
      !payload.userId ||
      !payload.projectId ||
      !payload.buildingId ||
      !payload.floorId ||
      !payload.work ||
      !payload.start_date ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields required.",
      });
    }

    // 🔹 Validate items
    for (const item of payload.items) {
      if (
        !item.itemId ||
        !item.required_quantity ||
        Number(item.required_quantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid item data",
        });
      }
    }

    const request = await requestMaterialModel.createRequestMaterialModel(
      payload
    );

    return res.status(201).json({
      success: true,
      message: "Request material created successfully",
      data: request,
    });
  } catch (error) {
    console.error("Create Request Material Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

const getAllRequestMaterials = async (req, res) => {
  try {
    const rows = await requestMaterialModel.getAllRequestMaterialsModel();

    const requestMap = new Map();

    rows.forEach((row) => {
      if (!requestMap.has(row.request_id)) {
        requestMap.set(row.request_id, {
          request_material_id: row.request_id,
          request_no: row.request_no,

          user_name: row.user_name,
          user_phone: row.user_phone,

          project_name: row.project_name,
          building_name: row.building_name,
          floor_name: row.floor_name,

          flat_name: row.flat_name,
          common_area_name: row.common_area_name,

          work: row.work,
          start_date: row.start_date,
          remark: row.remark,
          status: row.status,

          items: [],
        });
      }

      requestMap.get(row.request_id).items.push({
        request_material_item_id: row.request_item_id,
        item_name: row.item_name,
        required_quantity: row.required_quantity,
        unit: row.unit,
      });
    });

    res.status(200).json(Array.from(requestMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch request materials" });
  }
};

const updateRequestMaterialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ✅ Allowed status values (as per ENUM)
    const allowedStatus = ["draft", "pending", "approved"];

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Request material ID is required",
      });
    }

    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updated = await requestMaterialModel.updateRequestMaterialStatusModel(
      id,
      status
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Request material not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request material status updated successfully",
    });
  } catch (error) {
    console.error("Update Request Material Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  createRequestMaterial,
  getAllRequestMaterials,
  updateRequestMaterialStatus,
};
