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
      so.order_number,
      u.name as created_by_name
    FROM wo_bills wb
    LEFT JOIN service_orders so ON wb.wo_id = so.id
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
};
