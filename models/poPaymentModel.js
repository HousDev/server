const db = require("..//config/db");

/**
 * Create PO Payment
 */
const createPayment = async (data) => {
  const connection = await db.pool.getConnection();
  console.log(data);
  try {
    await connection.beginTransaction();

    const {
      po_id,
      transaction_type = "PAYMENT",
      amount_paid,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      status = "SUCCESS",
      remarks,
      created_by,
    } = data;

    // 🔒 Lock PO row to prevent race conditions
    const [[po]] = await connection.query(
      `SELECT * 
       FROM purchase_orders 
       WHERE id = ? 
       FOR UPDATE`,
      [po_id]
    );

    if (!po) {
      throw new Error("PO not found");
    }

    let newBalance = Number(po.balance_amount);
    let totalPaid = Number(po.total_paid);

    if (status === "SUCCESS") {
      if (transaction_type === "PAYMENT") {
        if (Number(amount_paid) > Number(po.balance_amount)) {
          throw new Error("Payment exceeds PO balance");
        }
        newBalance -= Number(amount_paid);
        totalPaid += Number(amount_paid);
      }

      if (transaction_type === "REFUND") {
        newBalance += Number(amount_paid);
        totalPaid -= Number(amount_paid);
      }

      const status =
        newBalance === 0
          ? "completed"
          : newBalance === Number(po.grand_total)
          ? "pending"
          : "partial";

      await connection.query(
        `UPDATE purchase_orders 
         SET balance_amount = ?, total_paid = ?, payment_status = ?
         WHERE id = ?`,
        [newBalance, totalPaid, status, po_id]
      );
    }

    // ➕ Insert payment record
    const [result] = await connection.query(
      `INSERT INTO po_payments (
        po_id,
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
        po_id,
        transaction_type,
        amount_paid,
        payment_method,
        payment_reference_no,
        payment_proof,
        payment_date,
        status,
        remarks,
        created_by,
      ]
    );

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
 * Get all payments (Admin)
 */
const getPayments = async () => {
  const rows = await db.query(
    `SELECT *
     FROM po_payments
     ORDER BY created_at DESC`
  );

  return rows;
};

/**
 * Admin: Full update payment
 */
const updatePayment = async (id, data) => {
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
    `UPDATE po_payments SET
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
    ]
  );

  return result.affectedRows;
};

/**
 * Admin: Delete payment (hard delete)
 * ⚠️ Use only if business allows
 */
const deletePayment = async (id) => {
  const result = await db.query(`DELETE FROM po_payments WHERE id = ?`, [id]);

  return result.affectedRows;
};

module.exports = {
  createPayment,
  getPayments,
  updatePayment,
  deletePayment,
};
