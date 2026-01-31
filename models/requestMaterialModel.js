const { pool, query } = require("../config/db");
const { createActivityLog } = require("../models/logsModel");

const createRequestMaterialModel = async (data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      request_no,
      userId,
      projectId,
      buildingId,
      floorId,
      flatId,
      commonAreaId,
      work,
      start_date,
      remark,
      items,
    } = data;

    // 1️⃣ Insert request_material
    const [requestResult] = await connection.execute(
      `INSERT INTO request_material
        (request_no, userId, projectId, buildingId, floorId, flatId, commonAreaId,
         work, start_date, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request_no,
        userId,
        projectId,
        buildingId,
        floorId,
        flatId || null,
        commonAreaId || null,
        work,
        start_date,
        remark || null,
      ]
    );

    const requestMaterialId = requestResult.insertId;

    // 2️⃣ Insert request_material_items
    for (const item of items) {
      if (item.approved_quantity) {
        await connection.execute(
          `INSERT INTO request_material_items
         (requestMaterialId, itemId, required_quantity, approved_quantity)
         VALUES (?, ?, ?, ?)`,
          [
            requestMaterialId,
            item.itemId,
            item.required_quantity,
            item.approved_quantity,
          ]
        );
      } else {
        await connection.execute(
          `INSERT INTO request_material_items
         (requestMaterialId, itemId, required_quantity)
         VALUES (?, ?, ?)`,
          [requestMaterialId, item.itemId, item.required_quantity]
        );
      }
    }
    const user = await query("SELECT * FROM users WHERE id = ? ", [userId]);

    const [notifyRes] = await connection.execute(
      `INSERT INTO notifications
         (title, description, type)
         VALUES (?, ?, ?)`,
      [
        "New Material Request.",
        "New Material Request From User" + user[0].full_name,
        "Requirement",
      ]
    );

    if (notifyRes.affectedRows === 1)
      createActivityLog(
        "Material Request",
        requestMaterialId,
        "Material Request Created",
        `Material Request Created Request ID: ${requestMaterialId}, By User Id: ${userId}`,
        userId
      );

    await connection.commit();

    return {
      id: requestMaterialId,
      request_no,
      userId,
      projectId,
      buildingId,
      floorId,
      flatId,
      commonAreaId,
      work,
      start_date,
      remark,
      items,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


const createPORequestMaterialModel = async (data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      request_no,
      userId,
      projectId,
      buildingId,
      floorId,
      flatId,
      commonAreaId,
      work,
      start_date,
      previous_request_id,
      remark,
      items,
    } = data;

    // 1️⃣ Insert request_material
    const [requestResult] = await connection.execute(
      `INSERT INTO request_material
        (request_no, userId, projectId, buildingId, floorId, flatId, commonAreaId,
         work, start_date, remark,previous_request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        request_no,
        userId,
        projectId,
        buildingId,
        floorId,
        flatId || null,
        commonAreaId || null,
        work,
        start_date,
        remark || null,
        previous_request_id,
      ],
    );

    const requestMaterialId = requestResult.insertId;

    // 2️⃣ Insert request_material_items
    for (const item of items) {
      if (item.approved_quantity) {
        await connection.execute(
          `INSERT INTO request_material_items
         (requestMaterialId, itemId, required_quantity, approved_quantity)
         VALUES (?, ?, ?, ?)`,
          [
            requestMaterialId,
            item.itemId,
            item.required_quantity,
            item.approved_quantity,
          ],
        );
      } else {
        await connection.execute(
          `INSERT INTO request_material_items
         (requestMaterialId, itemId, required_quantity)
         VALUES (?, ?, ?)`,
          [requestMaterialId, item.itemId, item.required_quantity],
        );
      }
    }
    const user = await query("SELECT * FROM users WHERE id = ? ", [userId]);

    const [notifyRes] = await connection.execute(
      `INSERT INTO notifications
         (title, description, type)
         VALUES (?, ?, ?)`,
      [
        "New Material Request.",
        "New Material Request From User" + user[0].full_name,
        "Requirement",
      ],
    );

    if (notifyRes.affectedRows === 1)
      createActivityLog(
        "Material Request",
        requestMaterialId,
        "Material Request Created",
        `Material Request Created Request ID: ${requestMaterialId}, By User Id: ${userId}`,
        userId,
      );

    await connection.commit();

    return {
      id: requestMaterialId,
      request_no,
      userId,
      projectId,
      buildingId,
      floorId,
      flatId,
      commonAreaId,
      work,
      start_date,
      remark,
      items,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAllRequestMaterialsModel = async () => {
  const rows = await query(`
    SELECT
      rm.id AS request_id,
      rm.request_no,
      rm.work,
      rm.start_date,
      rm.status,
      rm.remark,
      rm.projectId,
      rm.buildingId,
      rm.floorId,
      rm.flatId,
      rm.commonAreaId,
      rm.previous_request_id AS previous_request_id,
      u.id AS user_id,
      u.full_name AS user_name,
      u.phone AS user_phone,

      p.name AS project_name,
      b.building_name,
      f.floor_name,
      fl.flat_name,
      ca.common_area_name,

      rmi.itemId AS request_item_id,
      i.item_name,
      i.unit AS unit,
      rmi.id,
      rmi.required_quantity,
      rmi.approved_quantity,
      rmi.status as item_status

    FROM request_material rm

    JOIN users u ON u.id = rm.userId
    JOIN projects p ON p.id = rm.projectId
    JOIN buildings b ON b.id = rm.buildingId
    JOIN floors f ON f.id = rm.floorId

    LEFT JOIN flats fl ON fl.id = rm.flatId
    LEFT JOIN common_areas ca ON ca.id = rm.commonAreaId

    JOIN request_material_items rmi
      ON rmi.requestMaterialId = rm.id

    JOIN items i
      ON i.id = rmi.itemId

    ORDER BY rm.id DESC
  `);

  return rows;
};

const updateRequestMaterialStatusModel = async (id, status, user_id) => {
  const result = await query(
    `UPDATE request_material
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, id],
  );
  if (result.affectedRows === 1)
    createActivityLog(
      "Material Request",
      id,
      "Updated Material Request Status",
      `Material Request Status Updated For Request ID: ${id}, STATUS:${status}`,
      user_id,
    );
  // result.affectedRows tells if any row was updated
  return result.affectedRows > 0;
};

const updateRequestMaterialItemsAndStatusModel = async (
  materialRequestId,
  items,
  userId,
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Update approved_quantity + item status
    for (const item of items) {
      const approvedQty = Number(item.approveQuantity) || 0;
      const requiredQty = Number(item.required_quantity);

      let itemStatus = "pending";
      if (approvedQty + Number(item.approved_quantity) === requiredQty) {
        itemStatus = "approved";
      } else if (
        approvedQty + Number(item.approved_quantity) < requiredQty &&
        approvedQty + Number(item.approved_quantity) > 0
      ) {
        itemStatus = "partial";
      }

      const [updateMaterialRequestItem] = await connection.execute(
        `UPDATE request_material_items
         SET approved_quantity = approved_quantity + ? , status = ?
         WHERE id = ? AND requestMaterialId = ?`,
        [approvedQty, itemStatus, item.id, materialRequestId],
      );
      if (updateMaterialRequestItem.affectedRows === 1)
        createActivityLog(
          "Material Request",
          item.id,
          "Updated Material Request Items.",
          `Updated Material Request Item, Item ID: ${item.id}, STATUS: ${itemStatus}}`,
          userId,
        );

      const quantity_after_approve = Number(item.stock_quantity) - approvedQty;
      if (quantity_after_approve < 0) {
        throw new Error(
          "Approved Quantity is greater than approved stock quantity",
        );
      }
      await query(
        `UPDATE inventory
     SET quantity_after_approve = ?
     WHERE item_id = ?`,
        [quantity_after_approve, item.request_material_item_id],
      );
    }

    // 2️⃣ Check if ALL items are approved
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count
       FROM request_material_items
       WHERE requestMaterialId = ?`,
      [materialRequestId],
    );

    const { total, approved_count } = rows[0];

    // 3️⃣ Update request_material status ONLY if all items approved

    if (Number(total) === Number(approved_count) && total > 0) {
      const [updatedMaterialRequest] = await connection.execute(
        `UPDATE request_material
         SET status = 'approved', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [materialRequestId],
      );
      if (updatedMaterialRequest.affectedRows === 1)
        createActivityLog(
          "Material Request",
          materialRequestId,
          "Approve Material Request.",
          `Material Request Status Updated For Request ID: ${materialRequestId}, STATUS: approved}`,
          userId,
        );
    }

    await connection.commit();

    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createRequestMaterialModel,
  getAllRequestMaterialsModel,
  updateRequestMaterialStatusModel,
  createPORequestMaterialModel,
  updateRequestMaterialItemsAndStatusModel,
};
