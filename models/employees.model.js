// // // backend/models/hrmsEmployees.model.js
// // const { promisePool } = require("../config/db");

// // /**
// //  * Get all employees
// //  */
// // const findAll = async () => {
// //   const [rows] = await promisePool.query(
// //     `SELECT
// //   e.id,
// //   e.first_name,
// //   e.last_name,
// //   e.email,
// //   e.phone,
// //   e.designation,
// //   e.joining_date,
// //   e.gender,
// //   e.office_location,
// //   e.attendence_location,

// //   e.role_id,
// //   r.name AS role_name,

// //   e.department_id,
// //   d.name AS department_name,

// //   e.allotted_project,
// //   p.name AS project_name
// // FROM hrms_employees e
// // LEFT JOIN roles r ON r.id = e.role_id
// // LEFT JOIN departments d ON d.id = e.department_id
// // LEFT JOIN projects p ON p.id = e.allotted_project
// // ORDER BY e.first_name, e.last_name;
// // `,
// //   );
// //   return rows;
// // };

// // /**
// //  * Get employee by ID
// //  */
// // const findById = async (id) => {
// //   const [rows] = await promisePool.query(
// //     "SELECT * FROM hrms_employees WHERE id = ?",
// //     [id],
// //   );
// //   return rows[0] || null;
// // };

// // /**
// //  * Get employee by email
// //  */
// // const findByEmail = async (email) => {
// //   const [rows] = await promisePool.query(
// //     "SELECT * FROM hrms_employees WHERE email = ?",
// //     [email],
// //   );
// //   return rows[0] || null;
// // };

// // /**
// //  * Create employee
// //  */
// // const create = async (data) => {
// //   const {
// //     first_name,
// //     last_name,
// //     email,
// //     phone,
// //     role_id,
// //     department_id,
// //     designation,
// //     joining_date,
// //     gender,
// //     allotted_project,
// //     office_location = null,
// //     attendence_location,
// //   } = data;

// //   const [result] = await promisePool.query(
// //     `INSERT INTO hrms_employees
// //      (first_name, last_name, email, phone, role_id, department_id, designation,
// //       joining_date, gender, allotted_project, office_location, attendence_location)
// //      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// //     [
// //       first_name,
// //       last_name,
// //       email,
// //       phone,
// //       role_id,
// //       department_id,
// //       designation,
// //       joining_date,
// //       gender,
// //       allotted_project,
// //       office_location,
// //       attendence_location,
// //     ],
// //   );

// //   return await findById(result.insertId);
// // };

// // /**
// //  * Update employee
// //  */
// // const update = async (id, data) => {
// //   const fields = [];
// //   const values = [];

// //   const allowedFields = [
// //     "first_name",
// //     "last_name",
// //     "email",
// //     "phone",
// //     "role_id",
// //     "department_id",
// //     "designation",
// //     "joining_date",
// //     "gender",
// //     "allotted_project",
// //     "office_location",
// //     "attendence_location",
// //   ];

// //   allowedFields.forEach((key) => {
// //     if (Object.prototype.hasOwnProperty.call(data, key)) {
// //       fields.push(`${key} = ?`);
// //       values.push(data[key]);
// //     }
// //   });

// //   if (fields.length === 0) {
// //     return await findById(id);
// //   }

// //   values.push(id);

// //   const sql = `UPDATE hrms_employees SET ${fields.join(", ")} WHERE id = ?`;
// //   await promisePool.query(sql, values);

// //   return await findById(id);
// // };

// // /**
// //  * Delete employee
// //  */
// // const remove = async (id) => {
// //   const [result] = await promisePool.query(
// //     "DELETE FROM hrms_employees WHERE id = ?",
// //     [id],
// //   );
// //   return result.affectedRows > 0;
// // };

// // module.exports = {
// //   findAll,
// //   findById,
// //   findByEmail,
// //   create,
// //   update,
// //   remove,
// // };



// // backend/models/hrmsEmployees.model.js
// const { promisePool } = require("../config/db");

// /**
//  * Get all employees
//  */
// const findAll = async () => {
//   const [rows] = await promisePool.query(
//     `SELECT
//   e.id,
//   e.first_name,
//   e.last_name,
//   e.email,
//   e.phone,
//   e.designation,
//   e.joining_date,
//   e.gender,
//   e.office_location,
//   e.attendence_location,
//   e.profile_picture,

//   e.role_id,
//   r.name AS role_name,

//   e.department_id,
//   d.name AS department_name,

//   e.allotted_project,
//   p.name AS project_name
// FROM hrms_employees e
// LEFT JOIN roles r ON r.id = e.role_id
// LEFT JOIN departments d ON d.id = e.department_id
// LEFT JOIN projects p ON p.id = e.allotted_project
// ORDER BY e.first_name, e.last_name;
// `,
//   );
//   return rows;
// };

// /**
//  * Get employee by ID
//  */
// const findById = async (id) => {
//   const [rows] = await promisePool.query(
//     "SELECT * FROM hrms_employees WHERE id = ?",
//     [id],
//   );
//   return rows[0] || null;
// };

// /**
//  * Get employee by email
//  */
// const findByEmail = async (email) => {
//   const [rows] = await promisePool.query(
//     "SELECT * FROM hrms_employees WHERE email = ?",
//     [email],
//   );
//   return rows[0] || null;
// };

// /**
//  * Create employee
//  */

// // backend/models/hrmsEmployees.model.js - Update the create function

// const create = async (data) => {
//   const {
//     first_name,
//     last_name,
//     email,
//     phone,
//     role_id,
//     department_id,
//     designation,
//     joining_date,
//     gender,
//     allotted_project,
//     office_location = null,
//     attendence_location,
//     profile_picture = null
//     // REMOVED: employee_code, employee_status, user_id
//   } = data;

//   const [result] = await promisePool.query(
//     `INSERT INTO hrms_employees
//      (first_name, last_name, email, phone, role_id, department_id, designation,
//       joining_date, gender, allotted_project, office_location, attendence_location, profile_picture)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       first_name,
//       last_name,
//       email,
//       phone,
//       role_id,
//       department_id,
//       designation,
//       joining_date,
//       gender,
//       allotted_project,
//       office_location,
//       attendence_location,
//       profile_picture
//     ],
//   );

//   return await findById(result.insertId);
// };

// /**
//  * Update employee
//  */
// const update = async (id, data) => {
//   const fields = [];
//   const values = [];

//   const allowedFields = [
//     "first_name",
//     "last_name",
//     "email",
//     "phone",
//     "role_id",
//     "department_id",
//     "designation",
//     "joining_date",
//     "gender",
//     "allotted_project",
//     "office_location",
//     "attendence_location",
//     "profile_picture"
//   ];

//   allowedFields.forEach((key) => {
//     if (Object.prototype.hasOwnProperty.call(data, key)) {
//       fields.push(`${key} = ?`);
//       values.push(data[key]);
//     }
//   });

//   if (fields.length === 0) {
//     return await findById(id);
//   }

//   values.push(id);

//   const sql = `UPDATE hrms_employees SET ${fields.join(", ")} WHERE id = ?`;
//   await promisePool.query(sql, values);

//   return await findById(id);
// };

// /**
//  * Delete employee
//  */
// const remove = async (id) => {
//   const [result] = await promisePool.query(
//     "DELETE FROM hrms_employees WHERE id = ?",
//     [id],
//   );
//   return result.affectedRows > 0;
// };

// module.exports = {
//   findAll,
//   findById,
//   findByEmail,
//   create,
//   update,
//   remove,
// };




// backend/models/employees.model.js
const { promisePool } = require("../config/db");

/**
 * Get all employees with joins
 */
const findAll = async () => {
  try {
    const [rows] = await promisePool.query(`
      SELECT
        e.*,
        r.name AS role_name,
        d.name AS department_name,
        p.name AS project_name
      FROM hrms_employees e
      LEFT JOIN roles r ON r.id = e.role_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN projects p ON p.id = e.allotted_project
      ORDER BY e.first_name, e.last_name
    `);
    
    // Generate employee_code if not exists
    const employeesWithCode = rows.map(emp => ({
      ...emp,
      employee_code: emp.employee_code || `EMP${String(emp.id).padStart(4, '0')}`
    }));
    
    return employeesWithCode;
  } catch (error) {
    console.error("Find all employees error:", error);
    throw error;
  }
};

/**
 * Get employee by ID
 */
const findById = async (id) => {
  try {
    const [rows] = await promisePool.query(`
      SELECT
        e.*,
        r.name AS role_name,
        d.name AS department_name,
        p.name AS project_name
      FROM hrms_employees e
      LEFT JOIN roles r ON r.id = e.role_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN projects p ON p.id = e.allotted_project
      WHERE e.id = ?
    `, [id]);
    
    const employee = rows[0] || null;
    
    // Generate employee_code if not exists
    if (employee && !employee.employee_code) {
      employee.employee_code = `EMP${String(employee.id).padStart(4, '0')}`;
    }
    
    return employee;
  } catch (error) {
    console.error("Find by ID error:", error);
    throw error;
  }
};

/**
 * Get employee by email
 */
const findByEmail = async (email) => {
  try {
    const [rows] = await promisePool.query(
      "SELECT * FROM hrms_employees WHERE email = ?",
      [email]
    );
    
    const employee = rows[0] || null;
    
    // Generate employee_code if not exists
    if (employee && !employee.employee_code) {
      employee.employee_code = `EMP${String(employee.id).padStart(4, '0')}`;
    }
    
    return employee;
  } catch (error) {
    console.error("Find by email error:", error);
    throw error;
  }
};

/**
 * Create employee with comprehensive data
 */
const create = async (data) => {
  try {
    const columns = [];
    const values = [];
    const placeholders = [];

    // Map of column names to values
    const columnMap = {
      // Basic Details
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      role_id: data.role_id,
      department_id: data.department_id,
      designation: data.designation,
      joining_date: data.joining_date,
      gender: data.gender,
      allotted_project: data.allotted_project,
      office_location: data.office_location,
      attendence_location: data.attendence_location,
      profile_picture: data.profile_picture,
      employee_status: data.employee_status || 'active',
      
      // Personal Details
      blood_group: data.blood_group,
      date_of_birth: data.date_of_birth,
      marital_status: data.marital_status,
      emergency_contact: data.emergency_contact,
      nationality: data.nationality,
      
      // Address Details
      current_address: data.current_address,
      permanent_address: data.permanent_address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      same_as_permanent: data.same_as_permanent || false,
      
      // Identification
      aadhar_number: data.aadhar_number,
      pan_number: data.pan_number,
      
      // Educational Details
      highest_qualification: data.highest_qualification,
      university: data.university,
      passing_year: data.passing_year,
      percentage: data.percentage,
      
      // Employment Details
      employee_type: data.employee_type,
      branch: data.branch,
      probation_period: data.probation_period,
      work_mode: data.work_mode,
      date_of_leaving: data.date_of_leaving,
      job_title: data.job_title,
      notice_period: data.notice_period,
      
      // System Details
      laptop_assigned: data.laptop_assigned,
      system_login_id: data.system_login_id,
      system_password: data.system_password,
      office_email_id: data.office_email_id,
      office_email_password: data.office_email_password,
      
      // Bank Details
      bank_account_number: data.bank_account_number,
      bank_name: data.bank_name,
      ifsc_code: data.ifsc_code,
      upi_id: data.upi_id
    };

    // Build dynamic query
    Object.entries(columnMap).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        columns.push(key);
        values.push(value);
        placeholders.push('?');
      }
    });

    if (columns.length === 0) {
      throw new Error("No data provided for employee creation");
    }

    const sql = `INSERT INTO hrms_employees (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    
    console.log("Insert SQL:", sql);
    console.log("Insert values:", values);

    const [result] = await promisePool.query(sql, values);
    
    // Get the created employee with joins
    const createdEmployee = await findById(result.insertId);
    
    return createdEmployee;
  } catch (error) {
    console.error("Create employee error:", error);
    throw error;
  }
};

/**
 * Update employee with comprehensive data
 */
const update = async (id, data) => {
  try {
    const fields = [];
    const values = [];

    // Allowed fields for update
    const allowedFields = [
      // Basic Details
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
      "profile_picture",
      "employee_code",
      "employee_status",
      
      // Personal Details
      "blood_group",
      "date_of_birth",
      "marital_status",
      "emergency_contact",
      "nationality",
      
      // Address Details
      "current_address",
      "permanent_address",
      "city",
      "state",
      "pincode",
      "same_as_permanent",
      
      // Identification
      "aadhar_number",
      "pan_number",
      
      // Educational Details
      "highest_qualification",
      "university",
      "passing_year",
      "percentage",
      
      // Employment Details
      "employee_type",
      "branch",
      "probation_period",
      "work_mode",
      "date_of_leaving",
      "job_title",
      "notice_period",
      
      // System Details
      "laptop_assigned",
      "system_login_id",
      "system_password",
      "office_email_id",
      "office_email_password",
      
      // Bank Details
      "bank_account_number",
      "bank_name",
      "ifsc_code",
      "upi_id"
    ];

    // Add fields to update
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
    console.log("Update SQL:", sql);
    console.log("Update values:", values);

    await promisePool.query(sql, values);

    // Return updated employee with joins
    return await findById(id);
  } catch (error) {
    console.error("Update employee error:", error);
    throw error;
  }
};

/**
 * Delete employee
 */
const remove = async (id) => {
  try {
    const [result] = await promisePool.query(
      "DELETE FROM hrms_employees WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Delete employee error:", error);
    throw error;
  }
};

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
};