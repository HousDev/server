// // backend/models/serviceOrderModel.js
// const { promisePool } = require("../config/db");

// /**
//  * Helper: accept numbers or numeric-strings, return null for non-numeric
//  * Used for FK columns that are INT in DB (vendor_id, project_id, service_type_id).
//  */
// const toNullableInt = (v) => {
//   if (v === undefined || v === null || v === "") return null;
//   if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
//   if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
//   return null;
// };

// const findAll = async () => {
//   const [rows] = await promisePool.query(
//     `SELECT * FROM service_orders ORDER BY created_at DESC`
//   );
//   return rows;
// };

// const findById = async (id) => {
//   const [rows] = await promisePool.query(
//     `SELECT * FROM service_orders WHERE id = ?`,
//     [id]
//   );
//   return rows[0] || null;
// };

// const findBySoNumber = async (so_number) => {
//   const [rows] = await promisePool.query(
//     `SELECT * FROM service_orders WHERE so_number = ?`,
//     [so_number]
//   );
//   return rows[0] || null;
// };

// /**
//  * Basic search: so_number, service_name, vendor_id (cast to CHAR for LIKE).
//  * If you later join vendor table, replace vendor_id LIKE with vendor name search.
//  */
// const findByFilter = async (searchTerm) => {
//   const q = `%${searchTerm}%`;
//   const [rows] = await promisePool.query(
//     `SELECT * FROM service_orders
//      WHERE so_number LIKE ? OR service_name LIKE ? OR CAST(vendor_id AS CHAR) LIKE ?
//      ORDER BY created_at DESC`,
//     [q, q, q]
//   );
//   return rows;
// };

// /**
//  * Create a new service order.
//  * NOTE: Do NOT accept client-provided 'id' here; DB should be AUTO_INCREMENT for id.
//  * vendor_id, project_id, service_type_id are coerced to integers where possible.
//  * created_by is stored as-is (string or null) since column is VARCHAR.
//  * Dates are passed as JS Date objects so mysql2 will format them for DATETIME(3).
//  */
// const create = async (data) => {
//   const {
//     so_number,
//     vendor_id,
//     project_id,
//     service_type_id,
//     service_name,
//     description = null,
//     start_date,
//     end_date = null,
//     duration_days = 0,
//     estimated_cost = 0,
//     actual_cost = 0,
//     status = "scheduled",
//     priority = "medium",
//     location = null,
//     supervisor_name = null,
//     supervisor_phone = null,
//     notes = null,
//     created_by = null, // string (VARCHAR) or null
//     created_at = null,
//   } = data;

//   const vendorIdNum = toNullableInt(vendor_id);
//   const projectIdNum = toNullableInt(project_id);
//   const serviceTypeIdNum = toNullableInt(service_type_id);

//   // created_by is VARCHAR in DB, so pass as-is (string or null)
//   const createdByVal = created_by === undefined ? null : created_by;

//   // Convert date-like inputs into JS Date objects.
//   // mysql2 will serialize Date objects into MySQL DATETIME/TIMESTAMP format.
//   const startDateVal = start_date ? new Date(start_date) : null;
//   const endDateVal = end_date ? new Date(end_date) : null;
//   const createdAtVal = created_at ? new Date(created_at) : new Date();

//   const [result] = await promisePool.query(
//     `INSERT INTO service_orders
//       (so_number, vendor_id, project_id, service_type_id, service_name, description,
//        start_date, end_date, duration_days, estimated_cost, actual_cost, status,
//        priority, location, supervisor_name, supervisor_phone, notes, created_by, created_at)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       so_number,
//       vendorIdNum,
//       projectIdNum,
//       serviceTypeIdNum,
//       service_name,
//       description,
//       startDateVal,
//       endDateVal,
//       duration_days,
//       estimated_cost,
//       actual_cost,
//       status,
//       priority,
//       location,
//       supervisor_name,
//       supervisor_phone,
//       notes,
//       createdByVal,
//       createdAtVal,
//     ]
//   );

//   // result.insertId is the numeric id created by MySQL (AUTO_INCREMENT)
//   return await findById(result.insertId);
// };

// const update = async (id, data) => {
//   const fields = [];
//   const vals = [];

//   const allowed = [
//     "so_number",
//     "vendor_id",
//     "project_id",
//     "service_type_id",
//     "service_name",
//     "description",
//     "start_date",
//     "end_date",
//     "duration_days",
//     "estimated_cost",
//     "actual_cost",
//     "status",
//     "priority",
//     "location",
//     "supervisor_name",
//     "supervisor_phone",
//     "notes",
//     "created_by",
//     // created_at typically not updated
//   ];

//   allowed.forEach((k) => {
//     if (Object.prototype.hasOwnProperty.call(data, k)) {
//       // Coerce integer FKs if needed
//       if (["vendor_id", "project_id", "service_type_id"].includes(k)) {
//         const num = toNullableInt(data[k]);
//         fields.push(`${k} = ?`);
//         vals.push(num);
//       } else if (["start_date", "end_date"].includes(k)) {
//         // convert date-like inputs into Date objects
//         const v = data[k];
//         const val = v ? new Date(v) : null;
//         fields.push(`${k} = ?`);
//         vals.push(val);
//       } else {
//         fields.push(`${k} = ?`);
//         vals.push(data[k]);
//       }
//     }
//   });

//   if (fields.length === 0) return await findById(id);

//   vals.push(id);
//   const sql = `UPDATE service_orders SET ${fields.join(", ")} WHERE id = ?`;
//   await promisePool.query(sql, vals);

//   return await findById(id);
// };

// const remove = async (id) => {
//   const [result] = await promisePool.query(
//     `DELETE FROM service_orders WHERE id = ?`,
//     [id]
//   );
//   return result.affectedRows > 0;
// };

// const bulkUpdateStatus = async (ids = [], status) => {
//   if (!Array.isArray(ids) || ids.length === 0) return 0;
//   const [result] = await promisePool.query(
//     `UPDATE service_orders SET status = ? WHERE id IN (?)`,
//     [status, ids]
//   );
//   return result.affectedRows;
// };

// const bulkDelete = async (ids = []) => {
//   if (!Array.isArray(ids) || ids.length === 0) return 0;
//   const [result] = await promisePool.query(
//     `DELETE FROM service_orders WHERE id IN (?)`,
//     [ids]
//   );
//   return result.affectedRows;
// };

// module.exports = {
//   findAll,
//   findById,
//   findBySoNumber,
//   findByFilter,
//   create,
//   update,
//   remove,
//   bulkUpdateStatus,
//   bulkDelete,
// };



// backend/models/serviceOrderModel.js
const { promisePool } = require("../config/db");

/**
 * Helper: accept numbers or numeric-strings, return null for non-numeric
 */
const toNullableInt = (v) => {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
  return null;
};

const toNullableDecimal = (v) => {
  if (v === undefined || v === null || v === "") return 0.00;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v)) return parseFloat(v);
  return 0.00;
};

const findAll = async () => {
  const [rows] = await promisePool.query(
    `SELECT * FROM service_orders ORDER BY created_at DESC`
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await promisePool.query(
    `SELECT * FROM service_orders WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

const findBySoNumber = async (so_number) => {
  const [rows] = await promisePool.query(
    `SELECT * FROM service_orders WHERE so_number = ?`,
    [so_number]
  );
  return rows[0] || null;
};

/**
 * Search across multiple fields
 */
const findByFilter = async (searchTerm) => {
  const q = `%${searchTerm}%`;
  const [rows] = await promisePool.query(
    `SELECT so.* FROM service_orders so
     LEFT JOIN vendors v ON so.vendor_id = v.id
     LEFT JOIN projects p ON so.project_id = p.id
     LEFT JOIN service_types st ON so.service_type_id = st.id
     LEFT JOIN buildings b ON so.building_id = b.id
     WHERE so.so_number LIKE ? 
        OR v.name LIKE ? 
        OR p.name LIKE ? 
        OR st.name LIKE ?
        OR b.name LIKE ?
        OR so.note LIKE ?
     ORDER BY so.created_at DESC`,
    [q, q, q, q, q, q]
  );
  return rows;
};

/**
 * Create a new service order
 */
const create = async (data) => {
  const {
    so_number,
    vendor_id,
    project_id,
    service_type_id,
    building_id,
    so_date,
    start_date,
    end_date,
    
    // Financial fields
    sub_total = 0.00,
    discount_percentage = 0.00,
    discount_amount = 0.00,
    taxable_amount = 0.00,
    cgst_amount = 0.00,
    sgst_amount = 0.00,
    igst_amount = 0.00,
    total_gst_amount = 0.00,
    grand_total = 0.00,
    
    // Payment fields
    payment_terms = "",
    terms_and_conditions = "",
    advance_amount = 0.00,
    total_paid = 0.00,
    balance_amount = 0.00,
    
    // Status fields
    status = 'draft',
    service_status = 'pending',
    selected_terms_ids = "",
    note = "",
    
    created_by = null,
    created_at = null,
  } = data;

  // Convert IDs
  const vendorIdNum = toNullableInt(vendor_id);
  const projectIdNum = toNullableInt(project_id);
  const serviceTypeIdNum = toNullableInt(service_type_id);
  const buildingIdNum = toNullableInt(building_id);

  // Convert financial values
  const subTotalVal = toNullableDecimal(sub_total);
  const discountPctVal = toNullableDecimal(discount_percentage);
  const discountAmtVal = toNullableDecimal(discount_amount);
  const taxableAmtVal = toNullableDecimal(taxable_amount);
  const cgstAmtVal = toNullableDecimal(cgst_amount);
  const sgstAmtVal = toNullableDecimal(sgst_amount);
  const igstAmtVal = toNullableDecimal(igst_amount);
  const totalGstVal = toNullableDecimal(total_gst_amount);
  const grandTotalVal = toNullableDecimal(grand_total);
  const advanceAmtVal = toNullableDecimal(advance_amount);
  const totalPaidVal = toNullableDecimal(total_paid);
  const balanceAmtVal = toNullableDecimal(balance_amount);

  // Convert dates
  const soDateVal = so_date ? new Date(so_date) : null;
  const startDateVal = start_date ? new Date(start_date) : null;
  const endDateVal = end_date ? new Date(end_date) : null;
  const createdAtVal = created_at ? new Date(created_at) : new Date();

  const [result] = await promisePool.query(
    `INSERT INTO service_orders
      (so_number, vendor_id, project_id, service_type_id, building_id,
       so_date, start_date, end_date,
       sub_total, discount_percentage, discount_amount, taxable_amount,
       cgst_amount, sgst_amount, igst_amount, total_gst_amount, grand_total,
       payment_terms, terms_and_conditions, advance_amount, total_paid, balance_amount,
       status, service_status, selected_terms_ids, note,
       created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      so_number,
      vendorIdNum,
      projectIdNum,
      serviceTypeIdNum,
      buildingIdNum,
      soDateVal,
      startDateVal,
      endDateVal,
      subTotalVal,
      discountPctVal,
      discountAmtVal,
      taxableAmtVal,
      cgstAmtVal,
      sgstAmtVal,
      igstAmtVal,
      totalGstVal,
      grandTotalVal,
      payment_terms,
      terms_and_conditions,
      advanceAmtVal,
      totalPaidVal,
      balanceAmtVal,
      status,
      service_status,
      selected_terms_ids,
      note,
      created_by,
      createdAtVal,
    ]
  );

  return await findById(result.insertId);
};

const update = async (id, data) => {
  const fields = [];
  const vals = [];

  const allowed = [
    "so_number", "vendor_id", "project_id", "service_type_id", "building_id",
    "so_date", "start_date", "end_date",
    "sub_total", "discount_percentage", "discount_amount", "taxable_amount",
    "cgst_amount", "sgst_amount", "igst_amount", "total_gst_amount", "grand_total",
    "payment_terms", "terms_and_conditions", "advance_amount", "total_paid", "balance_amount",
    "status", "service_status", "selected_terms_ids", "note", "created_by"
  ];

  allowed.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      // Handle different field types
      if (["vendor_id", "project_id", "service_type_id", "building_id"].includes(k)) {
        const num = toNullableInt(data[k]);
        fields.push(`${k} = ?`);
        vals.push(num);
      } else if (["so_date", "start_date", "end_date"].includes(k)) {
        const val = data[k] ? new Date(data[k]) : null;
        fields.push(`${k} = ?`);
        vals.push(val);
      } else if ([
        "sub_total", "discount_percentage", "discount_amount", "taxable_amount",
        "cgst_amount", "sgst_amount", "igst_amount", "total_gst_amount", "grand_total",
        "advance_amount", "total_paid", "balance_amount"
      ].includes(k)) {
        const val = toNullableDecimal(data[k]);
        fields.push(`${k} = ?`);
        vals.push(val);
      } else {
        fields.push(`${k} = ?`);
        vals.push(data[k]);
      }
    }
  });

  if (fields.length === 0) return await findById(id);

  vals.push(id);
  const sql = `UPDATE service_orders SET ${fields.join(", ")} WHERE id = ?`;
  await promisePool.query(sql, vals);

  return await findById(id);
};

const remove = async (id) => {
  const [result] = await promisePool.query(
    `DELETE FROM service_orders WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

const bulkUpdateStatus = async (ids = [], status, field = 'status') => {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const [result] = await promisePool.query(
    `UPDATE service_orders SET ${field} = ? WHERE id IN (?)`,
    [status, ids]
  );
  return result.affectedRows;
};

const bulkDelete = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const [result] = await promisePool.query(
    `DELETE FROM service_orders WHERE id IN (?)`,
    [ids]
  );
  return result.affectedRows;
};

module.exports = {
  findAll,
  findById,
  findBySoNumber,
  findByFilter,
  create,
  update,
  remove,
  bulkUpdateStatus,
  bulkDelete,
};