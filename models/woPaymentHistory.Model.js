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
      bill_id,
      transaction_type,
      amount_paid,
      approved_amount_paid,
      advance_amount,
      retention_percentage,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      payment_due_date,
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
         SET total_paid = ?, advance_amount = ?, balance_amount = ?, payment_status = ?
         WHERE id = ?`,
        [
          Number(amount_paid) + Number(wo.total_paid || 0),
          Number(amount_paid) + Number(wo.advance_amount || 0),
          Number(wo.balance_amount) - Number(amount_paid),
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
    } else if (status === "SUCCESS" && transaction_type === "PAYMENT") {
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
          retention_percent,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          status,
          remarks,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wo_id, // Use the inserted ID from the previous query
          transaction_type,
          amount_paid,
          retention_percentage,
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
          bill_id,
          transaction_type,
          amount_paid,
          approved_amount_paid,
          retention_percent,
          payment_date,
          payment_due_date,
          status,
          remarks,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wo_id,
          bill_id,
          transaction_type,
          amount_paid,
          approved_amount_paid,
          retention_percentage,
          payment_date,
          payment_due_date,
          status,
          remarks,
          created_by,
        ],
      );

      await connection.query(
        `UPDATE wo_bills set request_amount = request_amount + ? WHERE id = ?`,
        [amount_paid, bill_id],
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
 * Update WO Payment
 */
const updateWoPayment = async (id, data) => {
  const connection = await db.pool.getConnection();
  try {
    console.log("pay modal", data);
    await connection.beginTransaction();
    const {
      transaction_type,
      amount_paid,
      retention_percent,
      payment_method,
      payment_date,
      payment_due_date,
      payment_reference_no,
      payment_proof,
      wo_advance_amount,
      advance_amount = 0,
      status,
      remarks,
      approved_amount_paid,
      bill_amount,
      bill_balance,
      bill_created_by,
      bill_date,
      bill_due_date,
      bill_id,
      bill_number,
      bill_proof,
      bill_retention,
      bill_status,
      vendor,
      so_number,
      retention_amount,
      paid_on,
    } = data;

    const [[exisistingTransaction]] = await connection.query(
      `SELECT * FROM wo_payments_history WHERE id = ?`,
      [id],
    );

    console.log("transaction", exisistingTransaction);
    if (!exisistingTransaction) {
      throw new Error("Payment Transaction not found");
    }

    const [[exisistingWoBill]] = await connection.query(
      `SELECT * FROM wo_bills WHERE id = ?`,
      [bill_id],
    );
    console.log("bill", exisistingWoBill);

    if (!exisistingWoBill) {
      throw new Error("WO Bill not found");
    }
    const [[exisistingWO]] = await connection.query(
      `SELECT * FROM service_orders WHERE id = ?`,
      [exisistingTransaction.wo_id],
    );

    console.log("WO", exisistingWO);

    if (!exisistingWO) {
      throw new Error("Work Order not found");
    }

    const result = await connection.query(
      `UPDATE wo_payments_history SET
      approved_amount_paid = ?,
      payment_method = ?,
      payment_reference_no = ?,
      payment_proof = ?,
      paid_on = ?,
      previous_advance = ?,
      adjusted_advance = ?,
      status = ?,
      remarks = ?
     WHERE id = ?`,
      [
        approved_amount_paid,
        payment_method,
        payment_reference_no,
        payment_proof,
        paid_on,
        wo_advance_amount,
        advance_amount,
        status,
        remarks,
        id,
      ],
    );

    const billPaid =
      Number(exisistingWoBill.bill_paid) + Number(approved_amount_paid);
    const billBalance =
      Number(exisistingWoBill.bill_balance) - Number(approved_amount_paid);

    await connection.query(
      `UPDATE wo_bills SET
      bill_paid = ?,
      bill_balance = ?
      WHERE id = ?`,
      [billPaid, billBalance, bill_id],
    );

    const newAdvanceAmount =
      Number(exisistingWO.advance_amount) - Number(advance_amount);
    const newTotalPaid =
      Number(exisistingWO.total_paid) +
      (Number(amount_paid) - Number(advance_amount));
    const newRetentionAmount =
      Number(exisistingWO.retention_amount) + Number(retention_amount);
    const newBalanceAmount =
      Number(exisistingWO.balance_amount) -
      (Number(amount_paid) - Number(advance_amount));

    const paymentStatus =
      Number(newBalanceAmount) === 0
        ? "completed"
        : Number(newBalanceAmount) > 0 &&
            Number(newBalanceAmount) < Number(exisistingWO.grand_total)
          ? "partial"
          : "pending";

    await connection.query(
      `UPDATE service_orders SET
      advance_amount = ?,
      total_paid = ?,
      retention_amount = ?,
      balance_amount = ?,
      payment_status = ?
      WHERE id = ?`,
      [
        newAdvanceAmount,
        newTotalPaid,
        newRetentionAmount,
        newBalanceAmount,
        paymentStatus,
        exisistingWO.id,
      ],
    );

    await connection.commit();
    return result.affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

async function updatePaymentStatus(id, data) {
  const { status, rejectionReason, approved_amount_paid, amount_paid, wo_id } =
    data;
  console.log(data);
  if (status === "pending") {
    const connection = await db.pool.getConnection();

    const woPaymentHistory = await connection.query(
      `
    UPDATE wo_payments_history
    SET status = ?, rejection_reason = ?, approved_amount_paid = ?
    WHERE id = ?
    `,
      [status, rejectionReason, approved_amount_paid, id],
    );

    const requestAmount = Number(amount_paid) - Number(approved_amount_paid);

    await connection.query(
      `
    UPDATE wo_bills
    SET request_amount = request_amount - ?
    WHERE id = ?
    `,
      [requestAmount, wo_id],
    );
    await connection.commit();
    return woPaymentHistory;
  }
  if (status === "rejected") {
    const connection = await db.pool.getConnection();

    const woPaymentHistory = await connection.query(
      `
    UPDATE wo_payments_history
    SET status = ?, rejection_reason = ?
    WHERE id = ?
    `,
      [status, rejectionReason, id],
    );

    const requestAmount = Number(approved_amount_paid);

    await connection.query(
      `
    UPDATE wo_bills
    SET request_amount = request_amount - ?
    WHERE id = ?
    `,
      [requestAmount, wo_id],
    );

    await connection.commit();
    return woPaymentHistory;
  }
}

/**
 * Get WO Payment History
 */
const getWoPaymentsHistory = async () => {
  const rows = await db.query(
    `SELECT 
      wph.*, 
      so.so_number AS po_number,
      so.so_date as po_date,
      v.name as vendor,
      so.grand_total as wo_grand_total,
      so.total_paid as wo_total_paid,
      so.advance_amount as wo_advance_amount,
      so.balance_amount as wo_balance_amount,
      so.retention_amount as wo_retention_amount,
      so.payment_status as wo_payment_status,
      wb.bill_number,
      wb.bill_amount,
      wb.bill_balance,
      wb.bill_retention,
      wb.bill_date,
      wb.bill_due_date,
      wb.bill_proof,
      wb.status as bill_status,
      wb.created_by as bill_created_by
     FROM wo_payments_history wph
     LEFT JOIN service_orders so ON so.id = wph.wo_id LEFT JOIN vendors AS v ON so.vendor_id = v.id LEFT JOIN wo_bills AS wb ON wb.id = wph.bill_id
     ORDER BY wph.created_at DESC`,
  );

  return rows;
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
  updatePaymentStatus,
};
