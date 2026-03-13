// models/woBillsModel.js
const { query } = require("../config/db");

/**
 * Create Bill
 */
async function createWoBill(data) {
  const {
    wo_id,
    bill_number,
    bill_amount,
    bill_balance,
    bill_retention,
    bill_date,
    bill_due_date,
    bill_proof,
    created_by,
  } = data;

  return await query(
    `
    INSERT INTO wo_bills
      (wo_id, bill_number, bill_amount, bill_balance, bill_retention, bill_date, bill_due_date, bill_proof, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      wo_id,
      bill_number,
      bill_amount,
      bill_balance,
      bill_retention,
      bill_date,
      bill_due_date,
      bill_proof,
      created_by,
    ],
  );
}

async function updateWoBillStatus(id, data) {
  const { status, rejectionReason } = data;

  return await query(
    `
    UPDATE wo_bills
    SET status = ?, rejection_reason = ?
    WHERE id = ?
    `,
    [status, rejectionReason, id],
  );
}

/**
 * Update Bill
 */
async function updateWoBill(id, data) {
  const {
    bill_number,
    bill_amount,
    bill_balance,
    bill_retention,
    bill_date,
    bill_due_date,
    bill_proof,
  } = data;

  return await query(
    `
    UPDATE wo_bills
    SET
      bill_number = ?,
      bill_amount = ?,
      bill_balance = ?,
      bill_retention = ?,
      bill_date = ?,
      bill_due_date = ?,
      bill_proof = ?
    WHERE id = ?
    `,
    [
      bill_number,
      bill_amount,
      bill_balance,
      bill_retention,
      bill_date,
      bill_due_date,
      bill_proof,
      id,
    ],
  );
}

/**
 * Delete Bill
 */
async function deleteWoBill(id) {
  return await query(`DELETE FROM wo_bills WHERE id = ?`, [id]);
}

/**
 * Find Bill By ID
 */
async function findWoBillById(id) {
  const data = await query(`SELECT * FROM wo_bills WHERE id = ?`, [id]);
  return data[0];
}

/**
 * Find Bills By Work Order
 */
async function findBillsByWoId(wo_id) {
  return await query(
    `SELECT * FROM wo_bills WHERE wo_id = ? ORDER BY id DESC`,
    [wo_id],
  );
}

/**
 * Find All Bills
 */
async function findAllWoBills() {
  return await query(`
    SELECT 
      wb.*,
      so.so_number,
      v.name as vendor,
      p.name as project_name,
      so.status as so_status,
      so.so_date,
      b.building_name,
      u.full_name as created_by_name
    FROM wo_bills wb
    LEFT JOIN service_orders so ON wb.wo_id = so.id
    LEFT JOIN vendors v ON v.id = so.vendor_id 
    LEFT JOIN projects p ON p.id = so.project_id
    LEFT JOIN buildings b ON b.id = so.building_id
    LEFT JOIN users u ON wb.created_by = u.id
    ORDER BY wb.id DESC
  `);
}

module.exports = {
  createWoBill,
  updateWoBill,
  deleteWoBill,
  findWoBillById,
  findBillsByWoId,
  findAllWoBills,
  updateWoBillStatus,
};
