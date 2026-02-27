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
      advance_amount,
      retention_percentage,
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

    if (status === "SUCCESS" && transaction_type === "ADVANCE") {
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
        [Number(amount_paid) + Number(wo.advance_amount || 0), woStatus, wo_id],
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
          transaction_type,
          amount_paid,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status || "PENDING",
          remarks || null,
          created_by,
        ],
      );
    }
    if (status === "SUCCESS" && transaction_type === "PAYMENT") {
      const woStatus =
        Number(amount_paid) > 0 &&
        Number(amount_paid) < Number(wo.balance_amount)
          ? "partial"
          : Number(amount_paid) - Number(wo.balance_amount) === 0
            ? "completed"
            : "pending";

      let retention_amount =
        (Number(amount_paid) * Number(retention_percentage)) / 100;

      let final_retention_amount =
        Number(wo.retention_amount) + Number(retention_amount);

      const amountAfterRetention =
        Number(amount_paid) - Number(retention_amount);

      const total_paid = Number(wo.total_paid) + Number(amountAfterRetention);

      const balance_amount =
        Number(wo.balance_amount) - Number(amountAfterRetention);

      const wo_advance_amount =
        Number(wo.advance_amount) - Number(advance_amount);

      await connection.query(
        `UPDATE service_orders 
         SET total_paid = ?, balance_amount = ?, advance_amount = ?, retention_amount = ?, payment_status = ?
         WHERE id = ?`,
        [
          Number(total_paid),
          Number(balance_amount),
          Number(wo_advance_amount),
          Number(final_retention_amount),
          woStatus,
          wo_id,
        ],
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
          transaction_type,
          amount_paid,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status || "PENDING",
          remarks || null,
          created_by,
        ],
      );
    } else {
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
          wo_id,
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
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Get WO Payment History
 */
const getWoPaymentsHistory = async () => {
  const rows = await db.query(
    `SELECT 
      wph.*, 
      so.so_number AS po_number,
      so.so_date as po_date,
      v.name as vendor
     FROM wo_payments_history wph
     LEFT JOIN service_orders so ON so.id = wph.wo_id LEFT JOIN vendors AS v ON so.vendor_id = v.id 
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
  getWoPaymentsHistory,
  updateWoPayment,
  deleteWoPayment,
};
