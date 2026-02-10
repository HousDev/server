const { query } = require("../config/db");

/**
 * Get all Service Orders
 */
async function findAllServiceOrders() {
  return await query(`SELECT * FROM service_orders ORDER BY created_at DESC`);
}

/**
 * Get Service Order by ID
 */
async function findServiceOrderById(id) {
  return await query(`SELECT * FROM service_orders WHERE id = ?`, [id]);
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
  return await query(
    `INSERT INTO service_orders (
      so_number,
      vendor_id,
      project_id,
      service_type_id,
      building_id,
      so_date,
      delivery_date,
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
      advance_amount,
      total_paid,
      balance_amount,
      status,
      service_status,
      selected_terms_ids,
      note,
      created_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      payload.so_number,
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

      payload.status ?? "draft",
      payload.service_status ?? "pending",

      payload.selected_terms_ids ?? null,
      payload.note ?? null,
      payload.created_by,
    ],
  );
}

/**
 * Update Service Order
 */
async function updateServiceOrder(id, payload) {
  return await query(
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
}

/**
 * Update Status only
 */
async function updateServiceOrderStatus(id, status) {
  return await query(`UPDATE service_orders SET status = ? WHERE id = ?`, [
    status,
    id,
  ]);
}

/**
 * Delete Service Order
 */
async function deleteServiceOrder(id) {
  return await query(`DELETE FROM service_orders WHERE id = ?`, [id]);
}

module.exports = {
  findAllServiceOrders,
  findServiceOrderById,
  findServiceOrdersByVendor,
  createServiceOrder,
  updateServiceOrder,
  updateServiceOrderStatus,
  deleteServiceOrder,
};
