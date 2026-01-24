// backend/models/hrmsEmployees.model.js
const { promisePool } = require("../config/db");

/**
 * Get all employees
 */
const findAll = async () => {
  const [rows] = await promisePool.query(
    `SELECT
  e.id,
  e.first_name,
  e.last_name,
  e.email,
  e.phone,
  e.designation,
  e.joining_date,
  e.gender,
  e.office_location,
  e.attendence_location,

  e.role_id,
  r.name AS role_name,

  e.department_id,
  d.name AS department_name,

  e.allotted_project,
  p.name AS project_name
FROM hrms_employees e
LEFT JOIN roles r ON r.id = e.role_id
LEFT JOIN departments d ON d.id = e.department_id
LEFT JOIN projects p ON p.id = e.allotted_project
ORDER BY e.first_name, e.last_name;
`,
  );
  return rows;
};

/**
 * Get employee by ID
 */
const findById = async (id) => {
  const [rows] = await promisePool.query(
    "SELECT * FROM hrms_employees WHERE id = ?",
    [id],
  );
  return rows[0] || null;
};

/**
 * Get employee by email
 */
const findByEmail = async (email) => {
  const [rows] = await promisePool.query(
    "SELECT * FROM hrms_employees WHERE email = ?",
    [email],
  );
  return rows[0] || null;
};

/**
 * Create employee
 */
const create = async (data) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    role_id,
    department_id,
    designation,
    joining_date,
    gender,
    allotted_project,
    office_location = null,
    attendence_location,
  } = data;

  const [result] = await promisePool.query(
    `INSERT INTO hrms_employees
     (first_name, last_name, email, phone, role_id, department_id, designation,
      joining_date, gender, allotted_project, office_location, attendence_location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      first_name,
      last_name,
      email,
      phone,
      role_id,
      department_id,
      designation,
      joining_date,
      gender,
      allotted_project,
      office_location,
      attendence_location,
    ],
  );

  return await findById(result.insertId);
};

/**
 * Update employee
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];

  const allowedFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "role_id",
    "department_id",
    "designation",
    "joining_date",
    "gender",
    "allotted_project",
    "office_location",
    "attendence_location",
  ];

  allowedFields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });

  if (fields.length === 0) {
    return await findById(id);
  }

  values.push(id);

  const sql = `UPDATE hrms_employees SET ${fields.join(", ")} WHERE id = ?`;
  await promisePool.query(sql, values);

  return await findById(id);
};

/**
 * Delete employee
 */
const remove = async (id) => {
  const [result] = await promisePool.query(
    "DELETE FROM hrms_employees WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
};
