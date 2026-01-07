const { pool, query } = require("../config/db");

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
      await connection.execute(
        `INSERT INTO request_material_items
         (requestMaterialId, itemId, required_quantity)
         VALUES (?, ?, ?)`,
        [requestMaterialId, item.itemId, item.required_quantity]
      );
    }
    const user = await query("SELECT * FROM users WHERE id = ? ", [userId]);
    await connection.execute(
      `INSERT INTO notifications
         (title, description, type)
         VALUES (?, ?, ?)`,
      [
        "New Material Request.",
        "New Material Request From User" + user[0].full_name,
        "Requirement",
      ]
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

      u.full_name AS user_name,
      u.phone AS user_phone,

      p.name AS project_name,
      b.building_name,
      f.floor_name,
      fl.flat_name,
      ca.common_area_name,

      rmi.itemId AS request_item_id,
      i.item_name,
      rmi.required_quantity

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

const updateRequestMaterialStatusModel = async (id, status) => {
  const result = await query(
    `UPDATE request_material
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, id]
  );

  // result.affectedRows tells if any row was updated
  return result.affectedRows > 0;
};

module.exports = {
  createRequestMaterialModel,
  getAllRequestMaterialsModel,
  updateRequestMaterialStatusModel,
};
