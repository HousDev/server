const { query, pool } = require("../config/db");

/**
 * Get all Service Orders
 */
async function findAllServiceOrders() {
  return await query(
    `SELECT so.*, v.name as vendor, p.name as project, b.building_name as building, u.full_name as created_by_user, pot.name as service_type FROM service_orders as so LEFT JOIN vendors as v ON v.id=so.vendor_id LEFT JOIN projects as p ON p.id=so.project_id LEFT JOIN buildings as b ON b.id = so.building_id LEFT JOIN users as u ON u.id = so.created_by LEFT JOIN po_types as pot ON pot.id = so.service_type_id ORDER BY created_at DESC`,
  );
}

/**
 * Get all Service Orders Tracking
 */
async function findAllServiceOrdersTrackings() {
  return await query(`SELECT * FROM so_service_tracking`);
}

/**
 * Get all Service Orders Services
 */
async function findAllServiceOrderServices(id) {
  return await query(
    `SELECT sos.* FROM service_order_services as sos WHERE so_id = ?`,
    [id],
  );
}

/**
 * Get Service Order by ID
 */
async function findServiceOrderById(id) {
  return await query(
    `SELECT so.*, v.name as vendor, p.name as project, b.building_name as building, u.full_name as created_by_user, pot.name as service_type FROM service_orders as so LEFT JOIN vendors as v ON v.id=so.vendor_id LEFT JOIN projects as p ON p.id=so.project_id LEFT JOIN buildings as b ON b.id = so.building_id LEFT JOIN users as u ON u.id = so.created_by LEFT JOIN po_types as pot ON pot.id = so.service_type_id WHERE so.id = ?`,
    [id],
  );
}

/**
 * Get Service Orders by Vendor
 */
async function findServiceOrdersByVendor(vendorId) {
  return await query(
    `SELECT * FROM service_orders WHERE vendor_id = ? ORDER BY created_at DESC`,
    [vendorId],
  );
}

/**
 * Create Service Order
 */
async function createServiceOrder(payload) {
  const conn = await pool.getConnection();
  const [so] = await conn.query(
    `INSERT INTO service_orders (
      so_number,
      vendor_id,
      project_id,
      building_id,
      service_type_id,
      so_date,
      delivery_date,
      is_interstate,
      sub_total,
      discount_percentage,
      discount_amount,
      taxable_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      total_gst_amount,
      grand_total,
      payment_terms,
      terms_and_conditions,
      selected_terms_ids,
      advance_amount,
      total_paid,
      balance_amount,
      status,
      service_status,
      note,
      created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.so_number,
      payload.vendor_id,
      payload.project_id,
      payload.building_id,
      payload.service_type_id,
      payload.so_date,
      payload.delivery_date,
      payload.is_interstate,

      payload.sub_total ?? 0,
      payload.discount_percentage ?? 0,
      payload.discount_amount ?? 0,
      payload.taxable_amount ?? 0,

      payload.cgst_amount ?? 0,
      payload.sgst_amount ?? 0,
      payload.igst_amount ?? 0,
      payload.total_gst_amount ?? 0,
      payload.grand_total ?? 0,

      payload.payment_terms ?? null,
      payload.terms_and_conditions ?? null,
      payload.selected_terms_ids ?? null,

      payload.advance_amount ?? 0,
      payload.total_paid ?? 0,
      payload.balance_amount ?? 0,

      payload.status ?? "draft",
      payload.service_status ?? "pending",

      payload.note ?? null,
      payload.created_by,
    ],
  );
  console.log("created so : ", so);
  // Insert items bulk if present
  if (Array.isArray(payload.items) && payload.items.length > 0) {
    const itemColumns = [
      "so_id",
      "service_id",
      "service_code",
      "service_name",
      "description",
      "sac_code",
      "quantity",
      "unit",
      "rate",
      "amount",
      "igst_rate",
      "cgst_rate",
      "sgst_rate",
      "gst_amount",
    ];

    const itemsValues = payload.items.map((it) => [
      so.insertId,
      it.service_id || null,
      it.service_code || null,
      it.service_name || null,
      it.description || null,
      it.sac_code || null,
      parseFloat(it.quantity || 0),
      it.unit || null,
      parseFloat(it.rate || 0),
      parseFloat(it.amount || 0),
      parseFloat(it.igst_rate || 0),
      parseFloat(it.cgst_rate || 0),
      parseFloat(it.sgst_rate || 0),
      parseFloat(it.gst_amount || 0),
    ]);

    // Bulk insert: VALUES ?
    const itemSql = `INSERT INTO service_order_services (${itemColumns.join(
      ", ",
    )}) VALUES ?`;

    const [services] = await conn.query(itemSql, [itemsValues]);
    console.log(services);

    if (Array.isArray(payload.items) && payload.items.length) {
      const cols = [
        "so_id",
        "service_id",
        "service_description",
        "quantity_ordered",
        "quantity_received",
        "quantity_pending",
        "status",
      ];

      const trackingRecords = payload.items.map((service) => ({
        so_id: so.insertId,
        service_id: service.service_id || null,
        service_description:
          service.service_name || service.description || null,
        quantity_ordered: parseFloat(service.quantity || 0),
        quantity_received: 0,
        quantity_pending: parseFloat(service.quantity || 0),
        status: "pending",
      }));

      const values = trackingRecords.map((r) => [
        so.insertId,
        r.service_id ?? null,
        r.service_description ?? null,
        parseFloat(r.quantity_ordered || 0),
        parseFloat(r.quantity_received || 0),
        parseFloat(r.quantity_pending || 0),
        r.status ?? "pending",
      ]);

      const sql = `INSERT INTO so_service_tracking (${cols.join(
        ", ",
      )}) VALUES ?`;
      const [serviceTrack] = await conn.query(sql, [values]);

      console.log("serviceTrack : ", serviceTrack);
    }
  }
  await conn.commit();
  return so;
}

/**
 * Update Service Order
 */
async function updateServiceOrder(id, payload) {
  console.log("data : ", id, payload);
  const conn = await pool.getConnection();
  const updatedService = await conn.query(
    `UPDATE service_orders SET
      vendor_id = ?,
      project_id = ?,
      service_type_id = ?,
      building_id = ?,
      so_date = ?,
      delivery_date = ?,
      sub_total = ?,
      discount_percentage = ?,
      discount_amount = ?,
      taxable_amount = ?,
      cgst_amount = ?,
      sgst_amount = ?,
      igst_amount = ?,
      total_gst_amount = ?,
      grand_total = ?,
      payment_terms = ?,
      terms_and_conditions = ?,
      advance_amount = ?,
      total_paid = ?,
      balance_amount = ?,
      status = ?,
      service_status = ?,
      selected_terms_ids = ?,
      note = ?
    WHERE id = ?`,
    [
      payload.vendor_id,
      payload.project_id,
      payload.service_type_id,
      payload.building_id ?? null,
      payload.so_date ?? null,
      payload.delivery_date,

      payload.sub_total ?? 0,
      payload.discount_percentage ?? 0,
      payload.discount_amount ?? 0,
      payload.taxable_amount ?? 0,

      payload.cgst_amount ?? 0,
      payload.sgst_amount ?? 0,
      payload.igst_amount ?? 0,
      payload.total_gst_amount ?? 0,
      payload.grand_total ?? 0,

      payload.payment_terms ?? null,
      payload.terms_and_conditions ?? null,

      payload.advance_amount ?? 0,
      payload.total_paid ?? 0,
      payload.balance_amount ?? 0,

      payload.status,
      payload.service_status,

      payload.selected_terms_ids ?? null,
      payload.note ?? null,
      id,
    ],
  );

  for (const it of payload.services) {
    const updateSOServiceSql = `
      UPDATE service_order_services
      SET
        service_id = ?,
        service_code = ?,
        service_name = ?,
        description = ?,
        sac_code = ?,
        quantity = ?,
        unit = ?,
        rate = ?,
        amount = ?,
        igst_rate=?,
        cgst_rate=?,
        sgst_rate=?,
        gst_amount = ?
      WHERE id = ? AND so_id = ?
    `;
    const createSOServiceSql = `
      INSERT INTO service_order_services(
        so_id,
        service_id,
        service_code,
        service_name,
        description,
        sac_code,
        quantity,
        unit,
        rate,
        amount,
        igst_rate,
        cgst_rate,
        sgst_rate,
        gst_amount
        )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const createSOServiceValues = [
      id, // po_id
      it.service_id || null,
      it.service_code || null,
      it.service_name || null,
      it.description || null,
      it.sac_code || null,
      parseFloat(it.quantity || 0),
      it.unit || null,
      parseFloat(it.rate || 0),
      parseFloat(it.amount || 0),
      parseFloat(it.igst_rate || 0),
      parseFloat(it.cgst_rate || 0),
      parseFloat(it.sgst_rate || 0),
      parseFloat(it.gst_amount || 0),
    ];
    const updateSOServiceValues = [
      it.service_id || null,
      it.service_code || null,
      it.service_name || null,
      it.description || null,
      it.sac_code || null,
      parseFloat(it.quantity || 0),
      it.unit || null,
      parseFloat(it.rate || 0),
      parseFloat(it.amount || 0),
      parseFloat(it.igst_rate || 0),
      parseFloat(it.cgst_rate || 0),
      parseFloat(it.sgst_rate || 0),
      parseFloat(it.gst_amount || 0),
      it.id,
      id,
    ];
    if (typeof it.id === "string") {
      await conn.query(createSOServiceSql, createSOServiceValues);

      const createColsForServiceTracking = `INSERT INTO so_service_tracking (
    so_id,
    service_id,
    service_description,
    quantity_ordered,
    quantity_received,
    quantity_pending,
    status
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

      const createValuesForServiceTracking = [
        id,
        it.service_id,
        it.description,
        it.quantity,
        0,
        it.quantity,
        "pending",
      ];
      await conn.query(
        createColsForServiceTracking,
        createValuesForServiceTracking,
      );
    } else {
      await conn.query(updateSOServiceSql, updateSOServiceValues);

      const updateColsForServiceTracking = `UPDATE  so_service_tracking  SET
    quantity_ordered = ?, quantity_pending = ?
   WHERE so_id = ? AND service_id = ?`;

      const updateValuesForServiceTracking = [
        it.quantity,
        it.quantity,
        id,
        it.item_id,
      ];
      await conn.query(
        updateColsForServiceTracking,
        updateValuesForServiceTracking,
      );
    }
  }
  await conn.commit();
  return updatedService;
}

/**
 * Update Status only
 */
async function updateServiceOrderStatus(id, status, note) {
  return await query(
    `UPDATE service_orders SET status = ?, note = ? WHERE id = ?`,
    [status, note, id],
  );
}

/**
 * Delete Service Order
 */
async function deleteServiceOrder(id) {
  return await query(`DELETE FROM service_orders WHERE id = ?`, [id]);
}

async function deleteServiceOrderService(soId, service_id) {
  await query(
    `DELETE FROM service_order_services WHERE so_id = ? AND service_id = ?`,
    [soId, service_id],
  );

  const dataRes = await query(
    `DELETE FROM service_order_services WHERE so_id = ? AND service_id = ?`,
    [soId, service_id],
  );

  return dataRes;
}

module.exports = {
  findAllServiceOrders,
  findServiceOrderById,
  findAllServiceOrderServices,
  findAllServiceOrdersTrackings,
  findServiceOrdersByVendor,
  createServiceOrder,
  updateServiceOrder,
  updateServiceOrderStatus,
  deleteServiceOrder,
  deleteServiceOrderService,
};
