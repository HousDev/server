// models/woBillsModel.js
const { query } = require("../config/db");
const db = require("../config/db");

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
  console.log(data);
  const retentionAmount = (Number(bill_amount) * Number(bill_retention)) / 100;
  const connection = await db.pool.getConnection();
  await connection.beginTransaction();

  await connection.query(
    `update service_orders set request_amount = request_amount + ? where id = ?`,
    [bill_amount, wo_id],
  );

  const bill = await connection.query(
    `
    INSERT INTO wo_bills
      (wo_id, bill_number, bill_amount, bill_balance, bill_retention, bill_date, bill_due_date, bill_proof,bill_retention_amount, bill_calcu_retention_amount, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      retentionAmount,
      retentionAmount,
      created_by,
    ],
  );

  await connection.commit();
  return bill;
}

async function updateWoBillStatus(id, data) {
  const { status, rejectionReason } = data;
  const connection = await db.pool.getConnection();
  await connection.beginTransaction();

  const [[woBill]] = await connection.query(
    "SELECT * FROM wo_bills where id = ?",
    [id],
  );

  if (status === "rejected") {
    await connection.query(
      `update service_orders set request_amount = request_amount - ? where id = ?`,
      [woBill.bill_amount, woBill.wo_id],
    );
  }

  const woBills = await connection.query(
    `
    UPDATE wo_bills
    SET status = ?, rejection_reason = ?
    WHERE id = ?
    `,
    [status, rejectionReason, id],
  );

  await connection.commit();

  return woBills;
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
      so.so_date,
      so.advance_amount as wo_advance_amount,
      so.balance_amount as wo_balance_amount,
      so.grand_total,
      so.request_amount as wo_request_amount,
      so.status as so_status,
      so.advance_amount,
      v.name as vendor,
      p.name as project_name,
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
