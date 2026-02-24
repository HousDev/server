const db = require("../config/db");

/**
 * Create Work Order Payment
 */
const createWoPayment = async (data) => {
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      wo_id,
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status = "SUCCESS",
      remarks,
      created_by,
    } = data;

    // 🔒 Lock WO row
    const [[wo]] = await connection.query(
      `SELECT * 
       FROM service_orders 
       WHERE id = ? 
       FOR UPDATE`,
      [wo_id],
    );

    if (!wo) {
      throw new Error("Work Order not found");
    }

    if (status === "SUCCESS") {
      const woStatus =
        Number(amount_paid) > 0 && Number(amount_paid) <= Number(wo.grand_total)
          ? "partial"
          : Number(amount_paid) + Number(wo.advance_amount) >=
              Number(wo.grand_total)
            ? "completed"
            : "pending";

      await connection.query(
        `UPDATE service_orders 
         SET advance_amount = ?, payment_status = ?
         WHERE id = ?`,
        [Number(amount_paid) + Number(wo.advance_amount), woStatus, wo_id],
      );

      // ➕ Insert history
      [result] = await connection.query(
        `INSERT INTO wo_payments_history (
          wo_id,
          transaction_type,
          amount_paid,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status,
          remarks,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wo_id, // Use the inserted ID from the previous query
          transxaction_type,
          amount_paid,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status || "PENDING",
          remarks || null,
        ],
      );
    } else {
      [result] = await connection.query(
        `INSERT INTO wo_payments_history (
          wo_id,
          wo_payment_id,
          transaction_type,
          amount_paid,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status,
          remarks,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wo_id,
          wo_payment_id,
          transaction_type,
          amount_paid,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status,
          remarks,
          created_by,
        ],
      );
    }

    await connection.commit();

    return {
      payment_id: result.insertId,
      balance_after_payment: newBalance,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Get All WO Payments
 */
const getWoPayments = async () => {
  const rows = await db.query(
    `SELECT 
      wop.*, 
      so.wo_number,
      DATE_FORMAT(so.wo_date, '%Y-%m-%d') as wo_date,
      so.payment_status,
      so.balance_amount as wo_balance_amount,
      so.grand_total as wo_grand_total,
      so.total_paid as wo_total_paid
     FROM wo_payments wop
     LEFT JOIN service_orders so ON wop.wo_id = so.id
     ORDER BY wop.created_at DESC`,
  );

  return rows;
};

/**
 * Get WO Payment History
 */
const getWoPaymentsHistory = async () => {
  const rows = await db.query(
    `SELECT 
      wph.*, 
      so.wo_number,
      so.wo_date
     FROM wo_payments_history wph
     LEFT JOIN service_orders so ON so.id = wph.wo_id
     ORDER BY wph.created_at DESC`,
  );

  return rows;
};

/**
 * Update WO Payment
 */
const updateWoPayment = async (id, data) => {
  const {
    transaction_type,
    amount_paid,
    payment_method,
    payment_reference_no,
    payment_proof,
    payment_date,
    status,
    remarks,
  } = data;

  const result = await db.query(
    `UPDATE wo_payments SET
      transaction_type = ?,
      amount_paid = ?,
      payment_method = ?,
      payment_reference_no = ?,
      payment_proof = ?,
      payment_date = ?,
      status = ?,
      remarks = ?
     WHERE id = ?`,
    [
      transaction_type,
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status,
      remarks,
      id,
    ],
  );

  return result.affectedRows;
};

/**
 * Delete WO Payment
 */
const deleteWoPayment = async (id) => {
  const result = await db.query(`DELETE FROM wo_payments WHERE id = ?`, [id]);

  return result.affectedRows;
};

module.exports = {
  createWoPayment,
  getWoPayments,
  getWoPaymentsHistory,
  updateWoPayment,
  deleteWoPayment,
};
