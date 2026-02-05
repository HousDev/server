const { query } = require("../config/db");

/* ---------------- FIND ALL ---------------- */
async function findAllActivePaymentMasters() {
  return await query(
    "SELECT * FROM payment_master WHERE is_active = true ORDER BY created_at DESC",
  );
}
async function findAllPaymentMasters() {
  return await query("SELECT * FROM payment_master ORDER BY created_at DESC");
}

/* ---------------- FIND BY ID ---------------- */
async function findPaymentMasterById(id) {
  const [row] = await query("SELECT * FROM payment_master WHERE id = ?", [id]);
  return row;
}

/* ---------------- CREATE ---------------- */
async function createPaymentMaster(payload) {
  const {
    event_trigger,
    percentPayment,
    firstText,
    materialPercent,
    secondText,
    gracePeriod,
    thirdText,
  } = payload;

  const result = await query(
    `
    INSERT INTO payment_master
      (event_trigger, percentPayment, firstText, materialPercent, secondText, gracePeriod, thirdText)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      event_trigger,
      percentPayment,
      firstText,
      materialPercent || null,
      secondText || null,
      gracePeriod || null,
      thirdText || null,
    ],
  );

  // return newly created payment master row
  const [paymentMaster] = await query(
    "SELECT * FROM payment_master WHERE id = ?",
    [result.insertId],
  );

  return paymentMaster;
}

/* ---------------- UPDATE ---------------- */
async function updatePaymentMaster(id, payload) {
  const {
    event_trigger,
    percentPayment,
    firstText,
    materialPercent,
    secondText,
    gracePeriod,
    thirdText,
    is_active,
  } = payload;

  await query(
    `
    UPDATE payment_master
    SET
      event_trigger = ?,
      percentPayment = ?,
      firstText = ?,
      materialPercent = ?,
      secondText = ?,
      gracePeriod = ?,
      thirdText = ?,
      is_active = ?
    WHERE id = ?
    `,
    [
      event_trigger,
      percentPayment,
      firstText,
      materialPercent || null,
      secondText || null,
      gracePeriod || null,
      thirdText || null,
      is_active ?? true,
      id,
    ],
  );

  const [updated] = await query("SELECT * FROM payment_master WHERE id = ?", [
    id,
  ]);

  return updated;
}

/* ---------------- SOFT DELETE ---------------- */
async function togglePaymentMasterStatus(id) {
  return await query(
    `
    UPDATE payment_master
    SET is_active = NOT is_active
    WHERE id = ?
    `,
    [id],
  );
}

/* ---------------- HARD DELETE (OPTIONAL) ---------------- */
async function deletePaymentMaster(id) {
  return await query("DELETE FROM payment_master WHERE id = ?", [id]);
}

/* ---------------- BULK TOGGLE ACTIVE ---------------- */
async function toggleBulkPaymentMasterStatus(ids = []) {
  if (!ids.length) return { affectedRows: 0 };

  const placeholders = ids.map(() => "?").join(",");

  return await query(
    `
    UPDATE payment_master
    SET is_active = NOT is_active
    WHERE id IN (${placeholders})
    `,
    ids,
  );
}

/* ---------------- BULK DELETE ---------------- */
async function deleteBulkPaymentMasters(ids = []) {
  if (!ids.length) return { affectedRows: 0 };

  const placeholders = ids.map(() => "?").join(",");

  return await query(
    `
    DELETE FROM payment_master
    WHERE id IN (${placeholders})
    `,
    ids,
  );
}

module.exports = {
  toggleBulkPaymentMasterStatus,
  deleteBulkPaymentMasters,
  findAllActivePaymentMasters,
  findAllPaymentMasters,
  findPaymentMasterById,
  createPaymentMaster,
  updatePaymentMaster,
  togglePaymentMasterStatus,
  deletePaymentMaster,
};
