// models/poModel.js
const { query } = require("../config/db");

async function findById(id) {
  const data = await query("SELECT * FROM service_orders WHERE id = ?", [id]);
  return data;
}

async function updateSO(id, payload) {
  const updateSOSQL =
    "UPDATE service_orders SET vendor_id = ?, project_id = ?, building_id = ?,po_type_id = ?,po_date = ?,delivery_date = ?, due_date=?, is_interstate = ?,subtotal = ?,discount_percentage = ?,discount_amount = ?,taxable_amount = ?,cgst_amount = ?,sgst_amount = ?,igst_amount = ?,total_gst_amount = ?,grand_total = ?,payment_terms_id = ?,advance_amount = ?,total_paid = ?,balance_amount = ?,selected_terms_ids = ?,terms_and_conditions = ?,notes = ?,status = ?,material_status = ?,payment_status = ?,created_by = ?,updated_at = NOW() WHERE id = ?";

  const updateSOValues = [
    payload.vendor_id,
    String(payload.project_id) || null,
    String(payload.building_id) || null,
    String(payload.po_type_id) || null,
    payload.po_date || null,
    payload.delivery_date || null,
    payload.due_date,
    payload.is_interstate ? 1 : 0,

    parseFloat(payload.subtotal || 0),
    parseFloat(payload.discount_percentage || 0),
    parseFloat(payload.discount_amount || 0),
    parseFloat(payload.taxable_amount || 0),

    parseFloat(payload.cgst_amount || 0),
    parseFloat(payload.sgst_amount || 0),
    parseFloat(payload.igst_amount || 0),
    parseFloat(payload.total_gst_amount || 0),
    parseFloat(payload.grand_total || 0),

    payload.payment_terms_id || null,
    parseFloat(payload.advance_amount || 0),
    parseFloat(payload.total_paid || 0),
    parseFloat(payload.balance_amount || 0),

    payload.selected_terms_ids || null,

    payload.terms_and_conditions || null,
    payload.notes || null,

    payload.status || "draft",
    payload.material_status || "pending",
    payload.payment_status || "pending",
    payload.created_by,

    id, // WHERE id = ?
  ];

  const poUpdateResponse = await query(updateSOSQL, updateSOValues);

  for (const it of payload.items) {
    const updateSOItemsSql = `
      UPDATE purchase_order_items
      SET
        item_id = ?,
        item_code = ?,
        item_name = ?,
        description = ?,
        hsn_code = ?,
        quantity = ?,
        unit = ?,
        rate = ?,
        amount = ?,
        igst_rate=?,
        cgst_rate=?,
        sgst_rate=?,
        gst_amount = ?
      WHERE id = ? AND po_id = ?
    `;
    const createPOItemsSql = `
      INSERT INTO purchase_order_items(
        po_id,
        item_id,
        item_code,
        item_name,
        description,
        hsn_code,
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

    const createPOItemsValues = [
      id, // po_id
      it.item_id || null,
      it.item_code || null,
      it.item_name || null,
      it.description || null,
      it.hsn_code || null,
      parseFloat(it.quantity || 0),
      it.unit || null,
      parseFloat(it.rate || 0),
      parseFloat(it.amount || 0),
      parseFloat(it.igst_rate || 0),
      parseFloat(it.cgst_rate || 0),
      parseFloat(it.sgst_rate || 0),
      parseFloat(it.gst_amount || 0),
    ];
    const updateSOItemsValues = [
      it.item_id || null,
      it.item_code || null,
      it.item_name || null,
      it.description || null,
      it.hsn_code || null,
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
      await query(createPOItemsSql, createPOItemsValues);

      const createColsForMaterialTracking = `INSERT INTO po_material_tracking (
    po_id,
    item_id,
    item_description,
    quantity_ordered,
    quantity_received,
    quantity_pending,
    status
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

      const createValuesForMaterialTracking = [
        id,
        it.item_id,
        it.description,
        it.quantity,
        0,
        it.quantity,
        "pending",
      ];
      await query(
        createColsForMaterialTracking,
        createValuesForMaterialTracking,
      );
    } else {
      await query(updateSOItemsSql, updateSOItemsValues);

      const updateColsForMaterialTracking = `UPDATE  po_material_tracking  SET
    quantity_ordered = ?, quantity_pending = ?
   WHERE po_id = ? AND item_id = ?`;

      const updateValuesForMaterialTracking = [
        it.quantity,
        it.quantity,
        id,
        it.item_id,
      ];
      await query(
        updateColsForMaterialTracking,
        updateValuesForMaterialTracking,
      );
    }
  }

  return await findById(id);
}

async function deletePO(id) {
  await query(`DELETE FROM purchase_orders WHERE id = ?`, [id]);
  return true;
}

async function deletePOItems(poItemId, poMaterialTrackingId) {
  let id = poMaterialTrackingId;

  const poDeleteMaterialTracking = await query(
    `DELETE FROM po_material_tracking WHERE id = ?`,
    [id],
  );

  id = poItemId;
  const poDeleteItem = await query(
    `DELETE FROM purchase_order_items WHERE id = ?`,
    [id],
  );

  return { poDeleteMaterialTracking, poDeleteItem };
}

async function updateSO_Status(id, status) {
  await query("UPDATE purchase_orders SET status = ? WHERE id = ?", [
    status,
    id,
  ]);
  return await findById(id);
}

module.exports = {
  initPOTables,
  updateSO,
  findById,
  deletePO,
  updateSO_Status,
  deletePOItems,
};
