const { promisePool } = require("../config/db");

/**
 * Check if a column exists in the table
 */
const checkColumnExists = async (tableName, columnName) => {
  try {
    const [result] = await promisePool.query(
      `
      SELECT COUNT(*) as exists_flag 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
    `,
      [tableName, columnName],
    );

    return result[0]?.exists_flag > 0;
  } catch (error) {
    console.error(`Error checking column ${columnName}:`, error);
    return false;
  }
};

/**
 * Check if a table exists
 */
const checkTableExists = async (tableName) => {
  try {
    const [result] = await promisePool.query(
      `
      SELECT COUNT(*) as exists_flag 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
    `,
      [tableName],
    );

    return result[0]?.exists_flag > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
};

/**
 * Get all employees with joins
 */
const findAll = async () => {
  try {
    // Check which columns and tables exist
    const hasCompanyIdColumn = await checkColumnExists(
      "hrms_employees",
      "company_id",
    );
    const hasCompaniesTable = await checkTableExists("companies");

    // Build dynamic SELECT columns
    const selectColumns = [
      "e.*",
      "r.name AS role_name",
      "d.name AS department_name",
      "p.name AS project_name",
    ];

    // Build dynamic JOIN clauses
    const joinClauses = [
      "LEFT JOIN roles r ON r.id = e.role_id",
      "LEFT JOIN departments d ON d.id = e.department_id",
      "LEFT JOIN projects p ON p.id = e.allotted_project",
    ];

    // Add company join if column and table exist
    if (hasCompanyIdColumn && hasCompaniesTable) {
      selectColumns.push("c.name AS company_name");
      joinClauses.push("LEFT JOIN companies c ON c.id = e.company_id");
    } else {
      selectColumns.push("NULL AS company_name");
    }

    // Build the final SQL query
    const sql = `
      SELECT
        ${selectColumns.join(", ")}
      FROM hrms_employees e
      ${joinClauses.join("\n")}
      ORDER BY e.first_name, e.last_name
    `;

    const [rows] = await promisePool.query(sql);

    // Parse allotted_project and attendance_location if they're JSON strings
    const employeesWithParsedData = rows.map((emp) => {
      // Parse allotted_project if it's a JSON string
      if (emp.allotted_project && typeof emp.allotted_project === "string") {
        try {
          const parsed = JSON.parse(emp.allotted_project);
          if (Array.isArray(parsed)) {
            emp.allotted_project = parsed;
          } else {
            // If it's a single number string, convert to array
            emp.allotted_project = [parseInt(emp.allotted_project)].filter(
              Boolean,
            );
          }
        } catch {
          // If not valid JSON, try to parse as number
          const num = parseInt(emp.allotted_project);
          emp.allotted_project = isNaN(num) ? [] : [num];
        }
      } else if (typeof emp.allotted_project === "number") {
        // If it's a number, convert to array
        emp.allotted_project = [emp.allotted_project];
      } else if (!emp.allotted_project) {
        // If null or undefined, set to empty array
        emp.allotted_project = [];
      }

      // Parse attendance_location if it's a JSON string
      if (
        emp.attendence_location &&
        typeof emp.attendence_location === "string"
      ) {
        try {
          emp.attendence_location = JSON.parse(emp.attendence_location);
        } catch {
          // Keep as string if not valid JSON
        }
      } else if (!emp.attendence_location) {
        emp.attendence_location = [];
      }

      // Generate employee_code if not exists
      emp.employee_code =
        emp.employee_code || `EMP${String(emp.id).padStart(4, "0")}`;

      return emp;
    });

    return employeesWithParsedData;
  } catch (error) {
    console.error("Find all employees error:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

/**
 * Get employee by ID
 */
const findById = async (id) => {
  try {
    // Check which columns exist
    const hasCompanyIdColumn = await checkColumnExists(
      "hrms_employees",
      "company_id",
    );
    const hasCompaniesTable = await checkTableExists("companies");

    // Build dynamic SELECT columns
    const selectColumns = [
      "e.*",
      "r.name AS role_name",
      "d.name AS department_name",
      "p.name AS project_name",
    ];

    // Build dynamic JOIN clauses
    const joinClauses = [
      "LEFT JOIN roles r ON r.id = e.role_id",
      "LEFT JOIN departments d ON d.id = e.department_id",
      "LEFT JOIN projects p ON p.id = e.allotted_project",
    ];

    // Add company join if column and table exist
    if (hasCompanyIdColumn && hasCompaniesTable) {
      selectColumns.push("c.name AS company_name");
      joinClauses.push("LEFT JOIN companies c ON c.id = e.company_id");
    } else {
      selectColumns.push("NULL AS company_name");
    }

    // Build the final SQL query
    const sql = `
      SELECT
        ${selectColumns.join(", ")}
      FROM hrms_employees e
      ${joinClauses.join("\n")}
      WHERE e.id = ?
    `;

    const [rows] = await promisePool.query(sql, [id]);

    const employee = rows[0] || null;

    if (employee) {
      // Parse allotted_project if it's a JSON string
      if (
        employee.allotted_project &&
        typeof employee.allotted_project === "string"
      ) {
        try {
          const parsed = JSON.parse(employee.allotted_project);
          if (Array.isArray(parsed)) {
            employee.allotted_project = parsed;
          } else {
            // If it's a single number string, convert to array
            employee.allotted_project = [
              parseInt(employee.allotted_project),
            ].filter(Boolean);
          }
        } catch {
          // If not valid JSON, try to parse as number
          const num = parseInt(employee.allotted_project);
          employee.allotted_project = isNaN(num) ? [] : [num];
        }
      } else if (typeof employee.allotted_project === "number") {
        // If it's a number, convert to array
        employee.allotted_project = [employee.allotted_project];
      } else if (!employee.allotted_project) {
        // If null or undefined, set to empty array
        employee.allotted_project = [];
      }

      // Parse attendance_location if it's a JSON string
      if (
        employee.attendence_location &&
        typeof employee.attendence_location === "string"
      ) {
        try {
          employee.attendence_location = JSON.parse(
            employee.attendence_location,
          );
        } catch {
          // Keep as string if not valid JSON
        }
      } else if (!employee.attendence_location) {
        employee.attendence_location = [];
      }

      // Generate employee_code if not exists
      employee.employee_code =
        employee.employee_code || `EMP${String(employee.id).padStart(4, "0")}`;
    }

    return employee;
  } catch (error) {
    console.error("Find by ID error:", error);
    return null;
  }
};

/**
 * Get employee by email
 */
const findByEmail = async (email) => {
  try {
    // Simple query without joins for email lookup
    const [rows] = await promisePool.query(
      "SELECT * FROM hrms_employees WHERE email = ?",
      [email],
    );

    const employee = rows[0] || null;

    if (employee) {
      // Parse allotted_project if it's a JSON string
      if (
        employee.allotted_project &&
        typeof employee.allotted_project === "string"
      ) {
        try {
          const parsed = JSON.parse(employee.allotted_project);
          if (Array.isArray(parsed)) {
            employee.allotted_project = parsed;
          } else {
            employee.allotted_project = [
              parseInt(employee.allotted_project),
            ].filter(Boolean);
          }
        } catch {
          const num = parseInt(employee.allotted_project);
          employee.allotted_project = isNaN(num) ? [] : [num];
        }
      } else if (typeof employee.allotted_project === "number") {
        employee.allotted_project = [employee.allotted_project];
      } else if (!employee.allotted_project) {
        employee.allotted_project = [];
      }

      // Parse attendance_location if it's a JSON string
      if (
        employee.attendence_location &&
        typeof employee.attendence_location === "string"
      ) {
        try {
          employee.attendence_location = JSON.parse(
            employee.attendence_location,
          );
        } catch {
          // Keep as string if not valid JSON
        }
      } else if (!employee.attendence_location) {
        employee.attendence_location = [];
      }

      // Generate employee_code if not exists
      employee.employee_code =
        employee.employee_code || `EMP${String(employee.id).padStart(4, "0")}`;
    }

    return employee;
  } catch (error) {
    console.error("Find by email error:", error);
    return null;
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

    // Check which columns exist
    const hasCompanyIdColumn = await checkColumnExists(
      "hrms_employees",
      "company_id",
    );
    const hasMiddleNameColumn = await checkColumnExists(
      "hrms_employees",
      "middle_name",
    );
    const hasSalaryColumn = await checkColumnExists("hrms_employees", "salary");
    const hasSalaryTypeColumn = await checkColumnExists(
      "hrms_employees",
      "salary_type",
    );
    const hasDateOfLeavingColumn = await checkColumnExists(
      "hrms_employees",
      "date_of_leaving",
    );

    // Parse allotted_project - convert array to JSON string
    let allottedProjectValue = null;
    if (data.allotted_project) {
      if (
        Array.isArray(data.allotted_project) &&
        data.allotted_project.length > 0
      ) {
        allottedProjectValue = JSON.stringify(
          data.allotted_project.map((id) => parseInt(id)).filter(Boolean),
        );
      } else if (typeof data.allotted_project === "number") {
        allottedProjectValue = JSON.stringify([data.allotted_project]);
      } else if (typeof data.allotted_project === "string") {
        try {
          const parsed = JSON.parse(data.allotted_project);
          if (Array.isArray(parsed)) {
            allottedProjectValue = JSON.stringify(
              parsed.map((id) => parseInt(id)).filter(Boolean),
            );
          } else {
            allottedProjectValue = JSON.stringify(
              [parseInt(data.allotted_project)].filter(Boolean),
            );
          }
        } catch {
          const num = parseInt(data.allotted_project);
          allottedProjectValue = isNaN(num) ? null : JSON.stringify([num]);
        }
      }
    }

    // Parse attendance_location - convert array to JSON string
    let attendanceLocationValue = null;
    if (data.attendence_location) {
      if (
        Array.isArray(data.attendence_location) &&
        data.attendence_location.length > 0
      ) {
        attendanceLocationValue = JSON.stringify(data.attendence_location);
      } else if (typeof data.attendence_location === "string") {
        try {
          const parsed = JSON.parse(data.attendence_location);
          if (Array.isArray(parsed)) {
            attendanceLocationValue = JSON.stringify(parsed);
          } else {
            attendanceLocationValue = data.attendence_location;
          }
        } catch {
          attendanceLocationValue = data.attendence_location;
        }
      }
    }

    // Map of column names to values - only include columns that exist

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
      allotted_project: allottedProjectValue,
      attendence_location: attendanceLocationValue,
      profile_picture: data.profile_picture,
      employee_status: data.employee_status || "active",
      user_id: data.user_id || null,

      // Personal Details
      blood_group: data.blood_group,
      date_of_birth: data.date_of_birth,
      marital_status: data.marital_status,
      emergency_contact: data.emergency_contact,
      emergency_contact_relationship: data.emergency_contact_relationship,
      emergency_contact_name: data.emergency_contact_name,
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
      probation_period: data.probation_period,
      work_mode: data.work_mode,
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
      upi_id: data.upi_id,
    };

    // Add optional columns if they exist
    if (hasMiddleNameColumn && data.middle_name !== undefined) {
      columnMap.middle_name = data.middle_name;
    }

    if (hasCompanyIdColumn && data.company_id !== undefined) {
      columnMap.company_id = data.company_id;
    }

    if (hasSalaryColumn && data.salary !== undefined) {
      columnMap.salary = data.salary;
    }

    if (hasSalaryTypeColumn && data.salary_type !== undefined) {
      columnMap.salary_type = data.salary_type;
    }

    if (hasDateOfLeavingColumn && data.date_of_leaving !== undefined) {
      columnMap.date_of_leaving = data.date_of_leaving;
    }

    // Build dynamic query
    Object.entries(columnMap).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        columns.push(key);
        values.push(value);
        placeholders.push("?");
      }
    });

    if (columns.length === 0) {
      throw new Error("No data provided for employee creation");
    }

    const sql = `INSERT INTO hrms_employees (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;

    const [result] = await promisePool.query(sql, values);

    // Get the created employee
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

    // ✅ Check optional columns
    const hasCompanyIdColumn = await checkColumnExists(
      "hrms_employees",
      "company_id",
    );
    const hasMiddleNameColumn = await checkColumnExists(
      "hrms_employees",
      "middle_name",
    );
    const hasSalaryColumn = await checkColumnExists("hrms_employees", "salary");
    const hasSalaryTypeColumn = await checkColumnExists(
      "hrms_employees",
      "salary_type",
    );
    const hasDateOfLeavingColumn = await checkColumnExists(
      "hrms_employees",
      "date_of_leaving",
    );

    // =====================================================
    // 🔥 FIX 1: Convert empty DATE fields to NULL
    // =====================================================
    const dateFields = ["date_of_birth", "joining_date", "date_of_leaving"];

    dateFields.forEach((field) => {
      if (data[field] === "") {
        data[field] = null;
      }
    });

    // =====================================================
    // 🔥 FIX 2: Convert empty string to NULL for numeric fields
    // =====================================================
    const numericFields = [
      "salary",
      "notice_period",
      "probation_period",
      "company_id",
    ];

    numericFields.forEach((field) => {
      if (data[field] === "") {
        data[field] = null;
      }
    });

    // =====================================================
    // 🔥 Parse allotted_project
    // =====================================================
    if (data.allotted_project !== undefined) {
      let value = null;

      if (
        Array.isArray(data.allotted_project) &&
        data.allotted_project.length > 0
      ) {
        value = JSON.stringify(
          data.allotted_project.map((id) => parseInt(id)).filter(Boolean),
        );
      } else if (typeof data.allotted_project === "string") {
        try {
          const parsed = JSON.parse(data.allotted_project);
          if (Array.isArray(parsed)) {
            value = JSON.stringify(
              parsed.map((id) => parseInt(id)).filter(Boolean),
            );
          }
        } catch {
          const num = parseInt(data.allotted_project);
          value = isNaN(num) ? null : JSON.stringify([num]);
        }
      }

      data.allotted_project = value;
    }

    // =====================================================
    // 🔥 Parse attendence_location
    // =====================================================
    if (data.attendence_location !== undefined) {
      let value = null;

      if (
        Array.isArray(data.attendence_location) &&
        data.attendence_location.length > 0
      ) {
        value = JSON.stringify(data.attendence_location);
      } else if (typeof data.attendence_location === "string") {
        try {
          const parsed = JSON.parse(data.attendence_location);
          if (Array.isArray(parsed)) {
            value = JSON.stringify(parsed);
          }
        } catch {
          value = data.attendence_location || null;
        }
      }

      data.attendence_location = value;
    }

    // =====================================================
    // ✅ Allowed fields
    // =====================================================
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
      "attendence_location",
      "profile_picture",
      "employee_code",
      "employee_status",
      "blood_group",
      "date_of_birth",
      "marital_status",
      "emergency_contact",
      "emergency_contact_relationship",
      "emergency_contact_name",
      "nationality",
      "current_address",
      "permanent_address",
      "city",
      "state",
      "pincode",
      "same_as_permanent",
      "aadhar_number",
      "pan_number",
      "highest_qualification",
      "university",
      "passing_year",
      "percentage",
      "employee_type",
      "probation_period",
      "work_mode",
      "notice_period",
      "laptop_assigned",
      "system_login_id",
      "system_password",
      "office_email_id",
      "office_email_password",
      "bank_account_number",
      "bank_name",
      "ifsc_code",
      "upi_id",
    ];

    if (hasMiddleNameColumn) allowedFields.push("middle_name");
    if (hasCompanyIdColumn) allowedFields.push("company_id");
    if (hasSalaryColumn) allowedFields.push("salary");
    if (hasSalaryTypeColumn) allowedFields.push("salary_type");
    if (hasDateOfLeavingColumn) allowedFields.push("date_of_leaving");

    // =====================================================
    // ✅ Build dynamic query
    // =====================================================
    allowedFields.forEach((key) => {
      if (
        Object.prototype.hasOwnProperty.call(data, key) &&
        key !== "designation_id"
      ) {
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
      [id],
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
