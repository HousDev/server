// models/poModel.js
const { pool, query } = require("../config/db");

async function initPOTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS purchase_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_number VARCHAR(100) NOT NULL UNIQUE,
      vendor_id INT,
      project_id VARCHAR(100),
      po_type_id VARCHAR(100),
      po_date DATE,
      delivery_date DATE,
      is_interstate TINYINT(1) DEFAULT 0,
      subtotal DECIMAL(14,2) DEFAULT 0,
      discount_percentage DECIMAL(6,2) DEFAULT 0,
      discount_amount DECIMAL(14,2) DEFAULT 0,
      taxable_amount DECIMAL(14,2) DEFAULT 0,
      cgst_amount DECIMAL(14,2) DEFAULT 0,
      sgst_amount DECIMAL(14,2) DEFAULT 0,
      igst_amount DECIMAL(14,2) DEFAULT 0,
      total_gst_amount DECIMAL(14,2) DEFAULT 0,
      grand_total DECIMAL(14,2) DEFAULT 0,
      payment_terms_id VARCHAR(100),
      advance_amount DECIMAL(14,2) DEFAULT 0,
      total_paid DECIMAL(14,2) DEFAULT 0,
      balance_amount DECIMAL(14,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'draft',
      material_status VARCHAR(50) DEFAULT 'pending',
      payment_status VARCHAR(50) DEFAULT 'pending',
      selected_terms_ids TEXT,
      terms_and_conditions TEXT,
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      item_id VARCHAR(100),
      item_code VARCHAR(100),
      item_name VARCHAR(255),
      description TEXT,
      hsn_code VARCHAR(50),
      quantity DECIMAL(14,3) DEFAULT 0,
      unit VARCHAR(50),
      rate DECIMAL(14,2) DEFAULT 0,
      amount DECIMAL(14,2) DEFAULT 0,
      gst_rate DECIMAL(6,2) DEFAULT 0,
      gst_amount DECIMAL(14,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS po_material_tracking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      item_id VARCHAR(100),
      item_description VARCHAR(255),
      quantity_ordered DECIMAL(14,3) DEFAULT 0,
      quantity_received DECIMAL(14,3) DEFAULT 0,
      quantity_pending DECIMAL(14,3) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS po_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      payment_type VARCHAR(50),
      amount DECIMAL(14,2) DEFAULT 0,
      due_date DATE,
      paid_date DATE,
      status VARCHAR(50) DEFAULT 'pending',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    await conn.query(`CREATE TABLE IF NOT EXISTS po_sequences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      prefix VARCHAR(50) DEFAULT 'PO',
      last_number INT DEFAULT 0,
      year INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

    // ensure at least one sequence row
    const [rows] = await conn.query("SELECT COUNT(*) AS cnt FROM po_sequences");
    if (Array.isArray(rows) && rows[0] && rows[0].cnt === 0) {
      await conn.query(
        "INSERT INTO po_sequences (prefix, last_number, year) VALUES (?, ?, ?)",
        ["PO", 0, new Date().getFullYear()]
      );
    }
  } finally {
    conn.release();
  }
}

async function findById(id) {
  const data = await query("SELECT * FROM purchase_orders WHERE id = ?", [id]);
  return data;
}

async function updatePO(id, payload) {
  const updatePOSQL =
    "UPDATE purchase_orders SET vendor_id = ?, project_id = ?,po_type_id = ?,po_date = ?,delivery_date = ?,is_interstate = ?,subtotal = ?,discount_percentage = ?,discount_amount = ?,taxable_amount = ?,cgst_amount = ?,sgst_amount = ?,igst_amount = ?,total_gst_amount = ?,grand_total = ?,payment_terms_id = ?,advance_amount = ?,total_paid = ?,balance_amount = ?,selected_terms_ids = ?,terms_and_conditions = ?,notes = ?,status = ?,material_status = ?,payment_status = ?,created_by = ?,updated_at = NOW() WHERE id = ?";

  const updatePOValues = [
    payload.vendor_id,
    String(payload.project_id) || null,
    String(payload.po_type_id) || null,
    payload.po_date || null,
    payload.delivery_date || null,
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

    JSON.stringify(
      Array.isArray(payload.selected_terms_ids)
        ? payload.selected_terms_ids
        : []
    ),

    payload.terms_and_conditions || null,
    payload.notes || null,

    payload.status || "draft",
    payload.material_status || "pending",
    payload.payment_status || "pending",
    payload.created_by,

    id, // WHERE id = ?
  ];

  const poUpdateResponse = await query(updatePOSQL, updatePOValues);

  for (const it of payload.items) {
    const updatePOItemsSql = `
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
        gst_rate = ?,
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
        gst_rate,
        gst_amount
        )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
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
      parseFloat(it.gst_rate || 0),
      parseFloat(it.gst_amount || 0),
    ];
    const updatePOItemsValues = [
      it.item_id || null,
      it.item_code || null,
      it.item_name || null,
      it.description || null,
      it.hsn_code || null,
      parseFloat(it.quantity || 0),
      it.unit || null,
      parseFloat(it.rate || 0),
      parseFloat(it.amount || 0),
      parseFloat(it.gst_rate || 0),
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
        0,
        "pending",
      ];
      const materialTracking = await query(
        createColsForMaterialTracking,
        createValuesForMaterialTracking
      );
    } else {
      await query(updatePOItemsSql, updatePOItemsValues);

      const updateColsForMaterialTracking = `UPDATE  po_material_tracking  SET
    quantity_ordered = ?
   WHERE po_id = ? AND item_id = ?`;

      const updateValuesForMaterialTracking = [it.quantity, id, it.item_id];
      await query(
        updateColsForMaterialTracking,
        updateValuesForMaterialTracking
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
    [id]
  );

  id = poItemId;
  const poDeleteItem = await query(
    `DELETE FROM purchase_order_items WHERE id = ?`,
    [id]
  );

  return { poDeleteMaterialTracking, poDeleteItem };
}

async function updatePO_Status(id, status) {
  await query("UPDATE purchase_orders SET status = ? WHERE id = ?", [
    status,
    id,
  ]);
  return await findById(id);
}

module.exports = {
  initPOTables,
  updatePO,
  findById,
  deletePO,
  updatePO_Status,
  deletePOItems,
};
