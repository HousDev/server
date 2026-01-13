const { query } = require("../config/db");

async function findAllTC() {
  return await query("SELECT * FROM terms_conditions ORDER BY created_at DESC");
}
async function findByIdTC(id) {
  return await query("SELECT * FROM terms_conditions WHERE id=?", [id]);
}
async function findByIdVendorsTC(id) {
  return await query(
    "SELECT * FROM terms_conditions WHERE vendor_id=? OR vendor_id=null OR vendor_id=0",
    [id]
  );
}
async function createTC(payload) {
  return await query(
    `INSERT INTO terms_conditions (
vendor_id,
category,
content,
is_active,
is_default) VALUES(?,?,?,?,?)`,
    [
      payload.vendor_id ?? null,
      payload.category,
      payload.content,
      payload.is_active,
      payload.is_default,
    ]
  );
}
async function updateTC(id, payload) {
  return await query(
    `UPDATE terms_conditions
SET
  vendor_id = ?,
  category = ?,
  content = ?,
  is_active = ?,
  is_default = ?
WHERE id = ?;
`,
    [
      payload.vendor_id ?? null,
      payload.category,
      payload.content,
      payload.is_active,
      payload.is_default,
      id,
    ]
  );
}

async function updateIs_DefaultTC(id, is_default) {
  return await query(
    `UPDATE terms_conditions
SET
  is_default = ?
WHERE id = ?;
`,
    [is_default, id]
  );
}

async function deleteTC(id) {
  return await query("DELETE FROM terms_conditions WHERE id = ?", [id]);
}

module.exports = {
  findAllTC,
  findByIdTC,
  createTC,
  updateTC,
  deleteTC,
  updateIs_DefaultTC,
  findByIdVendorsTC,
};
