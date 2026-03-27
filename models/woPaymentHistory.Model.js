const db = require("../config/db");

/**
 * Create Work Order Payment
 */
const createWoPayment = async (data) => {
  console.log(data);
  // return;
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      wo_id,
      bill_id,
      transaction_type,
      amount_paid,
      approved_amount_paid,
      retention_percentage,
      payment_method,
      payment_reference_no,
      payment_proof,
      payment_date,
      payment_due_date,
      status = "SUCCESS",
      remarks,
      created_by,
      paid_on,
      previous_advance,
      adjusted_advance,
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
         SET  advance_amount = ?, balance_amount = ?, payment_status = ?
         WHERE id = ?`,
        [
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
          approved_amount_paid,
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
    } else if (status === "SUCCESS" && transaction_type === "RETENTION") {
      const [[exisistingWoBill]] = await connection.query(
        `SELECT * FROM wo_bills WHERE id = ?`,
        [bill_id],
      );

      if (!exisistingWoBill) {
        throw new Error("WO Bill not found");
      }

      const newAdvanceAmount =
        Number(previous_advance) - Number(adjusted_advance);
      const newTotalPaid = Number(wo.total_paid) + Number(approved_amount_paid);
      const newRetentionAmount =
        Number(wo.retention_amount) - Number(approved_amount_paid);
      const newBalanceAmount =
        Number(wo.balance_amount) - Number(approved_amount_paid);
      const paymentStatus =
        Number(newBalanceAmount) === 0
          ? "completed"
          : Number(newBalanceAmount) > 0 &&
              Number(newBalanceAmount) < Number(wo.grand_total)
            ? "partial"
            : "pending";

      await connection.query(
        `UPDATE service_orders SET
      advance_amount = ?,
      total_paid = ?,
      retention_amount = ?,
      payment_status = ?
      WHERE id = ?`,
        [
          newAdvanceAmount,
          newTotalPaid,
          newRetentionAmount,
          paymentStatus,
          wo_id,
        ],
      );

      const billPaid =
        Number(exisistingWoBill.bill_paid) + Number(approved_amount_paid);

      const billBalance =
        Number(exisistingWoBill.bill_balance) - Number(approved_amount_paid);

      const retentionAmount =
        Number(exisistingWoBill.bill_retention_amount) -
        Number(approved_amount_paid);

      let billStatus = "";

      if (Number(billBalance) === 0) {
        billStatus = "completed";
      } else if (
        Number(billBalance) > 0 &&
        Number(billBalance) < Number(exisistingWoBill.bill_amount)
      ) {
        billStatus = "partial";
      } else {
        billStatus = "pending";
      }

      await connection.query(
        `UPDATE wo_bills SET
      bill_paid = ?,
      bill_balance = ?,
      bill_retention_amount = ?,
      status = ?
      WHERE id = ?`,
        [billPaid, billBalance, retentionAmount, billStatus, bill_id],
      );

      // console.log("in retention");
      // return;
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
          paid_on,
          status,
          remarks,
          created_by,
          payment_due_date,
          bill_id,
          approved_amount_paid,
          previous_advance,
          adjusted_advance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wo_id, // Use the inserted ID from the previous query
          transaction_type,
          amount_paid,
          retention_percentage,
          payment_method,
          payment_reference_no,
          payment_proof,
          payment_date,
          paid_on,
          status || "PENDING",
          remarks || null,
          created_by,
          payment_due_date,
          bill_id,
          approved_amount_paid,
          previous_advance,
          adjusted_advance,
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

    let billStatus = "";

    if (Number(billBalance) === 0) {
      billStatus = "completed";
    } else if (
      Number(billBalance) > 0 &&
      Number(billBalance) < Number(exisistingWoBill.bill_amount)
    ) {
      billStatus = "partial";
    } else {
      billStatus = "pending";
    }

    let newRetentionAmountForRetentionCalculation = 0;
    let retentionForServiceOrder = 0;
    const actualPay =
      Number(exisistingWoBill.bill_amount) -
      Number(exisistingWoBill.bill_retention_amount);

    if (Number(actualPay) === Number(approved_amount_paid)) {
      console.log("first");
      newRetentionAmountForRetentionCalculation = 0;
      retentionForServiceOrder =
        Number(exisistingWO.retention_amount) +
        Number(exisistingWoBill.bill_retention_amount);
    } else if (
      Number(exisistingWoBill.bill_retention_amount) ===
      Number(exisistingWoBill.bill_balance) - Number(approved_amount_paid)
    ) {
      console.log("third");
      newRetentionAmountForRetentionCalculation = 0;
      retentionForServiceOrder =
        Number(exisistingWO.retention_amount) +
        Number(exisistingWoBill.bill_calcu_retention_amount);
    } else if (Number(actualPay) !== Number(approved_amount_paid)) {
      console.log("second");
      newRetentionAmountForRetentionCalculation =
        Number(exisistingWoBill.bill_calcu_retention_amount) -
        (Number(approved_amount_paid) *
          Number(exisistingWoBill.bill_retention)) /
          100;

      retentionForServiceOrder =
        Number(exisistingWO.retention_amount) +
        (Number(approved_amount_paid) *
          Number(exisistingWoBill.bill_retention)) /
          100;
    }
    const requestAmount = Number(amount_paid) - Number(approved_amount_paid);

    await connection.query(
      `UPDATE wo_bills SET
      bill_paid = ?,
      bill_balance = ?,
      bill_calcu_retention_amount = ?,
      request_amount = request_amount - ?,
      status = ?
      WHERE id = ?`,
      [
        billPaid,
        billBalance,
        newRetentionAmountForRetentionCalculation,
        requestAmount,
        billStatus,
        bill_id,
      ],
    );

    console.log(
      retentionForServiceOrder,
      newRetentionAmountForRetentionCalculation,
    );

    const newAdvanceAmount =
      Number(exisistingWO.advance_amount) - Number(advance_amount);

    const newTotalPaid =
      Number(exisistingWO.total_paid) +
      (Number(approved_amount_paid) - Number(advance_amount));

    const newRetentionAmount =
      Number(exisistingWO.retention_amount) + Number(retention_amount);

    const newSubForBalanceAmount =
      Number(approved_amount_paid) +
      Number(retentionForServiceOrder) -
      Number(advance_amount);

    const newBalanceAmount =
      Number(exisistingWO.balance_amount) - Number(newSubForBalanceAmount);

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
        retentionForServiceOrder,
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
