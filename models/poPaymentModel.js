const db = require("..//config/db");
const { connect } = require("../routes/userRoutes");

/**
 * Create PO Payment
 */
const createPayment = async (data) => {
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      po_id,
      po_payment_id,
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

    // 🔒 Lock PO row to prevent race conditions
    const [[po]] = await connection.query(
      `SELECT * 
       FROM purchase_orders 
       WHERE id = ? 
       FOR UPDATE`,
      [po_id],
    );

    if (!po) {
      throw new Error("PO not found");
    }

    let newBalance = Number(po.balance_amount);
    let totalPaid = Number(po.total_paid);
    let result;
    if (status === "SUCCESS") {
      if (Number(amount_paid) > Number(po.balance_amount)) {
        throw new Error("Payment exceeds PO balance");
      }
      newBalance -= Number(amount_paid);
      totalPaid += Number(amount_paid);

      const postatus =
        newBalance === 0
          ? "completed"
          : newBalance === Number(po.grand_total)
            ? "pending"
            : "partial";

      await connection.query(
        `UPDATE purchase_orders 
         SET balance_amount = ?, total_paid = ?, payment_status = ?
         WHERE id = ?`,
        [newBalance, totalPaid, postatus, po_id],
      );

      // ➕ Insert payment record
      [result] = await connection.query(
        `INSERT INTO po_payments_history (
        po_id,
        po_payment_id,
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
          po_id,
          po_payment_id,
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

      const [[poPayment]] = await connection.query(
        "SELECT * FROM po_payments WHERE id = ?",
        [po_payment_id],
      );

      let poPyamentBalance = Number(poPayment.balance_amount);
      let poPaymentTotalPaid = Number(poPayment.amount_paid);

      poPyamentBalance -= Number(amount_paid);
      poPaymentTotalPaid += Number(amount_paid);

      const statusPoPayment =
        poPyamentBalance === 0
          ? "completed"
          : newBalance === Number(poPayment.total_amount)
            ? "pending"
            : "partial";

      await connection.query(
        `UPDATE po_payments 
         SET balance_amount = ?, amount_paid = ?, status = ?
         WHERE id = ?`,
        [poPyamentBalance, poPaymentTotalPaid, statusPoPayment, po_payment_id],
      );
    } else {
      [result] = await connection.query(
        `INSERT INTO po_payments_history (
        po_id,
        po_payment_id,
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
          po_id,
          po_payment_id,
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
 * Get all payments (Admin)
 */
const getPayments = async () => {
  const rows = await db.query(
    `SELECT 
    pop.*, po.po_number, DATE_FORMAT(po.po_date, '%Y-%m-%d') as po_date,
    v.name, po.payment_status,po.balance_amount AS po_balance_amount,po.grand_total as po_grand_total,
     po.total_paid as po_amount_paid, po.payment_status as po_payment_status
     FROM po_payments as pop LEFT JOIN purchase_orders as po ON pop.po_id = po.id LEFT JOIN vendors as v ON v.id=po.vendor_id
      ORDER BY pop.created_at DESC`,
  );
  return rows;
};

const getPaymentsHistory = async () => {
  const rows = await db.query(
    `SELECT 
    pph.*, po.po_number, po.po_date,v.name as vendor
     FROM po_payments_history as pph LEFT JOIN purchase_orders as po ON po.id = pph.po_id LEFT JOIN vendors as v ON v.id=po.vendor_id
      ORDER BY pph.created_at DESC`,
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
    ],
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
  getPaymentsHistory,
  getPayments,
  updatePayment,
  deletePayment,
};
