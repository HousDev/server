const upload = require("../middleware/upload");
const HrmsEmployee = require("../models/employees.model");
const fs = require("fs");
const path = require("path");

/**
 * Get all employees
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await HrmsEmployee.findAll();

    if (Array.isArray(employees)) {
      res.json(employees);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

/**
 * Get employee by ID
 */
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await HrmsEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get employee by ID error:", error);
    res.status(500).json({ message: "Failed to fetch employee" });
  }
};

/**
 * Get employee by email
 */
exports.getEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const employee = await HrmsEmployee.findByEmail(email);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get employee by email error:", error);
    res.status(500).json({ message: "Failed to fetch employee" });
  }
};

/**
 * Create employee with comprehensive data - WITH PHONE DUPLICATE CHECK
 */
exports.createEmployee = async (req, res) => {
  try {
    upload.single("profile_picture")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      // ✅ CHECK PHONE DUPLICATE ONLY ON CREATE
      if (req.body.phone && req.body.phone.trim() !== "") {
        try {
          const { query } = require("../config/db");

          // Check in employees table
          const empRows = await query(
            `SELECT id FROM hrms_employees WHERE phone = ? LIMIT 1`,
            [req.body.phone],
          );

          if (empRows && empRows.length > 0) {
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              message:
                "This phone number is already in use by another employee",
            });
          }

          // Check in users table
          const userRows = await query(
            `SELECT id FROM users WHERE phone = ? LIMIT 1`,
            [req.body.phone],
          );

          if (userRows && userRows.length > 0) {
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              message: "This phone number is already in use by a user",
            });
          }
        } catch (phoneCheckError) {
          // Continue with creation if check fails
        }
      }

      // Handle allotted_project as JSON array
      let final_allotted_project = null;
      if (req.body.allotted_project) {
        if (typeof req.body.allotted_project === "string") {
          try {
            const parsed = JSON.parse(req.body.allotted_project);
            if (Array.isArray(parsed) && parsed.length > 0) {
              final_allotted_project = JSON.stringify(
                parsed.map((id) => parseInt(id)).filter(Boolean),
              );
            }
          } catch {
            if (req.body.allotted_project.includes(",")) {
              const projects = req.body.allotted_project
                .split(",")
                .map((id) => parseInt(id.trim()))
                .filter(Boolean);
              if (projects.length > 0) {
                final_allotted_project = JSON.stringify(projects);
              }
            } else {
              const num = parseInt(req.body.allotted_project);
              if (!isNaN(num)) {
                final_allotted_project = JSON.stringify([num]);
              }
            }
          }
        } else if (
          Array.isArray(req.body.allotted_project) &&
          req.body.allotted_project.length > 0
        ) {
          final_allotted_project = JSON.stringify(
            req.body.allotted_project.map((id) => parseInt(id)).filter(Boolean),
          );
        }
      }

      // Handle attendance_location array
      let final_attendence_location = null;
      if (req.body.attendence_location) {
        if (typeof req.body.attendence_location === "string") {
          try {
            const parsed = JSON.parse(req.body.attendence_location);
            if (Array.isArray(parsed) && parsed.length > 0) {
              final_attendence_location = JSON.stringify(parsed);
            }
          } catch {
            if (req.body.attendence_location.includes(",")) {
              const locations = req.body.attendence_location
                .split(",")
                .map((loc) => loc.trim())
                .filter(Boolean);
              if (locations.length > 0) {
                final_attendence_location = JSON.stringify(locations);
              }
            } else if (req.body.attendence_location.trim() !== "") {
              final_attendence_location = JSON.stringify([
                req.body.attendence_location.trim(),
              ]);
            }
          }
        } else if (
          Array.isArray(req.body.attendence_location) &&
          req.body.attendence_location.length > 0
        ) {
          final_attendence_location = JSON.stringify(
            req.body.attendence_location,
          );
        }
      }

      // Basic required fields validation
      const requiredFields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "role_id",
        "department_id",
        "designation",
        "joining_date",
        "gender",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      // Prevent duplicate email
      const existing = await HrmsEmployee.findByEmail(req.body.email);
      if (existing) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(409).json({
          message: "Employee with this email already exists",
        });
      }

      // Prepare comprehensive employee data
      const employeeData = {
        // Basic Details
        first_name: req.body.first_name,
        middle_name: req.body.middle_name || null,
        last_name: req.body.last_name,
        email: req.body.email,
        phone: req.body.phone,
        role_id: req.body.role_id,
        department_id: req.body.department_id,
        designation: req.body.designation,
        joining_date: req.body.joining_date,
        gender: req.body.gender,
        allotted_project: final_allotted_project,
        attendence_location: final_attendence_location,
        company_id: req.body.company_id || null,
        profile_picture: req.file ? `/uploads/${req.file.filename}` : null,

        // Personal Details
        blood_group: req.body.blood_group || null,
        date_of_birth: req.body.date_of_birth || null,
        marital_status: req.body.marital_status || null,
        emergency_contact: req.body.emergency_contact || null,
        emergency_contact_relationship:
          req.body.emergency_contact_relationship || null,
        emergency_contact_name: req.body.emergency_contact_name || null,
        nationality: req.body.nationality || "Indian",

        // Address Details
        current_address: req.body.current_address || null,
        permanent_address: req.body.permanent_address || null,
        city: req.body.city || null,
        state: req.body.state || null,
        pincode: req.body.pincode || null,
        same_as_permanent:
          req.body.same_as_permanent === "true" ||
          req.body.same_as_permanent === true,

        // Identification
        aadhar_number: req.body.aadhar_number || null,
        pan_number: req.body.pan_number || null,

        // Educational Details
        highest_qualification: req.body.highest_qualification || null,
        university: req.body.university || null,
        passing_year: req.body.passing_year || null,
        percentage: req.body.percentage || null,
        user_id: req.body.user_id || null,
        // Employment Details
        employee_type: req.body.employee_type || "permanent",
        probation_period: req.body.probation_period || null,
        work_mode: req.body.work_mode || "office",
        date_of_leaving: req.body.date_of_leaving || null,
        notice_period: req.body.notice_period || "30",
        salary: req.body.salary || null,
        salary_type: req.body.salary_type || "monthly",

        // System Details
        laptop_assigned: req.body.laptop_assigned || "no",
        system_login_id: req.body.system_login_id || null,
        system_password: req.body.system_password || null,
        office_email_id: req.body.office_email_id || null,
        office_email_password: req.body.office_email_password || null,

        // Bank Details
        bank_account_number: req.body.bank_account_number || null,
        bank_name: req.body.bank_name || null,
        ifsc_code: req.body.ifsc_code || null,
        upi_id: req.body.upi_id || null,

        // Status (default to active)
        employee_status: req.body.employee_status || "active",
      };

      const employee = await HrmsEmployee.create(employeeData);

      // Generate employee code after creation
      const employeeCode = `EMP${String(employee.id).padStart(4, "0")}`;
      await HrmsEmployee.update(employee.id, { employee_code: employeeCode });

      employee.employee_code = employeeCode;

      res.status(201).json(employee);
    });
  } catch (error) {
    console.log("error while creating emp", error);

    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Failed to create employee",
      error: error.message,
    });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_status } = req.body;

    if (
      !employee_status ||
      !["active", "inactive", "on_leave", "terminated"].includes(
        employee_status,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const employee = await HrmsEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updateData = {
      employee_status: employee_status,
      updated_at: new Date(),
    };

    const updated = await HrmsEmployee.update(id, updateData);

    // Sync to user table
    try {
      const { query } = require("../config/db");
      const userRows = await query(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [employee.email],
      );

      if (userRows && userRows.length > 0) {
        const userId = userRows[0].id;
        await query(
          `UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?`,
          [employee_status === "active" ? 1 : 0, userId],
        );
      }
    } catch (syncError) {
      console.warn("Could not sync to user:", syncError.message);
    }

    res.json({
      success: true,
      message: `Employee ${employee_status} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Update employee status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update employee status",
      error: error.message,
    });
  }
};

/**
 * Update employee with comprehensive data - WITHOUT PHONE DUPLICATE CHECK
 */
exports.updateEmployee = async (req, res) => {
  try {
    upload.single("profile_picture")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { id } = req.params;
      const employee = await HrmsEmployee.findById(id);

      if (!employee) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "Employee not found" });
      }

      // ✅ REMOVED: Phone duplicate check on update
      // Users can update their phone without duplicate check

      // Handle allotted_project as JSON array
      let final_allotted_project = undefined;
      if (req.body.allotted_project !== undefined) {
        if (typeof req.body.allotted_project === "string") {
          try {
            const parsed = JSON.parse(req.body.allotted_project);
            if (Array.isArray(parsed)) {
              final_allotted_project =
                parsed.length > 0
                  ? JSON.stringify(
                      parsed.map((id) => parseInt(id)).filter(Boolean),
                    )
                  : JSON.stringify([]);
            }
          } catch {
            if (req.body.allotted_project.includes(",")) {
              const projects = req.body.allotted_project
                .split(",")
                .map((id) => parseInt(id.trim()))
                .filter(Boolean);
              final_allotted_project = JSON.stringify(projects);
            } else if (req.body.allotted_project.trim() === "") {
              final_allotted_project = JSON.stringify([]);
            } else {
              const num = parseInt(req.body.allotted_project);
              final_allotted_project = !isNaN(num)
                ? JSON.stringify([num])
                : JSON.stringify([]);
            }
          }
        } else if (Array.isArray(req.body.allotted_project)) {
          final_allotted_project = JSON.stringify(
            req.body.allotted_project.map((id) => parseInt(id)).filter(Boolean),
          );
        } else if (
          req.body.allotted_project === null ||
          req.body.allotted_project === ""
        ) {
          final_allotted_project = JSON.stringify([]);
        }
      }

      // Handle attendance_location array
      let final_attendence_location = undefined;
      if (req.body.attendence_location !== undefined) {
        if (typeof req.body.attendence_location === "string") {
          try {
            const parsed = JSON.parse(req.body.attendence_location);
            if (Array.isArray(parsed)) {
              final_attendence_location =
                parsed.length > 0 ? JSON.stringify(parsed) : JSON.stringify([]);
            }
          } catch {
            if (req.body.attendence_location.includes(",")) {
              const locations = req.body.attendence_location
                .split(",")
                .map((loc) => loc.trim())
                .filter(Boolean);
              final_attendence_location = JSON.stringify(locations);
            } else if (req.body.attendence_location.trim() === "") {
              final_attendence_location = JSON.stringify([]);
            } else {
              final_attendence_location = JSON.stringify([
                req.body.attendence_location.trim(),
              ]);
            }
          }
        } else if (Array.isArray(req.body.attendence_location)) {
          final_attendence_location = JSON.stringify(
            req.body.attendence_location,
          );
        } else if (
          req.body.attendence_location === null ||
          req.body.attendence_location === ""
        ) {
          final_attendence_location = JSON.stringify([]);
        }
      }

      // If email is being updated, check uniqueness
      if (req.body.email && req.body.email !== employee.email) {
        const existing = await HrmsEmployee.findByEmail(req.body.email);
        if (existing) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(409).json({
            message: "Email already in use by another employee",
          });
        }
      }

      // Prepare update data - ALWAYS use existing values as fallback
      const updateData = {
        // Basic Details
        first_name:
          req.body.first_name !== undefined
            ? req.body.first_name
            : employee.first_name,
        middle_name:
          req.body.middle_name !== undefined
            ? req.body.middle_name
            : employee.middle_name,
        last_name:
          req.body.last_name !== undefined
            ? req.body.last_name
            : employee.last_name,
        email: req.body.email !== undefined ? req.body.email : employee.email,
        phone: req.body.phone !== undefined ? req.body.phone : employee.phone,
        role_id:
          req.body.role_id !== undefined ? req.body.role_id : employee.role_id,
        department_id:
          req.body.department_id !== undefined
            ? req.body.department_id
            : employee.department_id,
        designation:
          req.body.designation !== undefined
            ? req.body.designation
            : employee.designation,
        joining_date:
          req.body.joining_date !== undefined
            ? req.body.joining_date
            : employee.joining_date,
        gender:
          req.body.gender !== undefined ? req.body.gender : employee.gender,
        company_id:
          req.body.company_id !== undefined
            ? req.body.company_id
            : employee.company_id,

        // Personal Details
        blood_group:
          req.body.blood_group !== undefined
            ? req.body.blood_group
            : employee.blood_group,
        date_of_birth:
          req.body.date_of_birth !== undefined
            ? req.body.date_of_birth
            : employee.date_of_birth,
        marital_status:
          req.body.marital_status !== undefined
            ? req.body.marital_status
            : employee.marital_status,
        emergency_contact:
          req.body.emergency_contact !== undefined
            ? req.body.emergency_contact
            : employee.emergency_contact,
        emergency_contact_relationship:
          req.body.emergency_contact_relationship !== undefined
            ? req.body.emergency_contact_relationship
            : employee.emergency_contact_relationship,
        emergency_contact_name:
          req.body.emergency_contact_name !== undefined
            ? req.body.emergency_contact_name
            : employee.emergency_contact_name,
        nationality:
          req.body.nationality !== undefined
            ? req.body.nationality
            : employee.nationality,

        // Address Details
        current_address:
          req.body.current_address !== undefined
            ? req.body.current_address
            : employee.current_address,
        permanent_address:
          req.body.permanent_address !== undefined
            ? req.body.permanent_address
            : employee.permanent_address,
        city: req.body.city !== undefined ? req.body.city : employee.city,
        state: req.body.state !== undefined ? req.body.state : employee.state,
        pincode:
          req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
        same_as_permanent:
          req.body.same_as_permanent !== undefined
            ? req.body.same_as_permanent === "true" ||
              req.body.same_as_permanent === true
            : employee.same_as_permanent,

        // Identification
        aadhar_number:
          req.body.aadhar_number !== undefined
            ? req.body.aadhar_number
            : employee.aadhar_number,
        pan_number:
          req.body.pan_number !== undefined
            ? req.body.pan_number
            : employee.pan_number,

        // Educational Details
        highest_qualification:
          req.body.highest_qualification !== undefined
            ? req.body.highest_qualification
            : employee.highest_qualification,
        university:
          req.body.university !== undefined
            ? req.body.university
            : employee.university,
        passing_year:
          req.body.passing_year !== undefined
            ? req.body.passing_year
            : employee.passing_year,
        percentage:
          req.body.percentage !== undefined
            ? req.body.percentage
            : employee.percentage,

        // Employment Details
        employee_type:
          req.body.employee_type !== undefined
            ? req.body.employee_type
            : employee.employee_type,
        probation_period:
          req.body.probation_period !== undefined
            ? req.body.probation_period
            : employee.probation_period,
        work_mode:
          req.body.work_mode !== undefined
            ? req.body.work_mode
            : employee.work_mode,
        date_of_leaving:
          req.body.date_of_leaving !== undefined
            ? req.body.date_of_leaving
            : employee.date_of_leaving,
        notice_period:
          req.body.notice_period !== undefined
            ? req.body.notice_period
            : employee.notice_period,
        salary:
          req.body.salary !== undefined ? req.body.salary : employee.salary,
        salary_type:
          req.body.salary_type !== undefined
            ? req.body.salary_type
            : employee.salary_type,

        // System Details
        laptop_assigned:
          req.body.laptop_assigned !== undefined
            ? req.body.laptop_assigned
            : employee.laptop_assigned,
        system_login_id:
          req.body.system_login_id !== undefined
            ? req.body.system_login_id
            : employee.system_login_id,
        system_password:
          req.body.system_password !== undefined
            ? req.body.system_password
            : employee.system_password,
        office_email_id:
          req.body.office_email_id !== undefined
            ? req.body.office_email_id
            : employee.office_email_id,
        office_email_password:
          req.body.office_email_password !== undefined
            ? req.body.office_email_password
            : employee.office_email_password,

        // Bank Details
        bank_account_number:
          req.body.bank_account_number !== undefined
            ? req.body.bank_account_number
            : employee.bank_account_number,
        bank_name:
          req.body.bank_name !== undefined
            ? req.body.bank_name
            : employee.bank_name,
        ifsc_code:
          req.body.ifsc_code !== undefined
            ? req.body.ifsc_code
            : employee.ifsc_code,
        upi_id:
          req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,

        // Status
        employee_status:
          req.body.employee_status !== undefined
            ? req.body.employee_status
            : employee.employee_status,
      };

      // Handle allotted_project separately
      if (final_allotted_project !== undefined) {
        updateData.allotted_project = final_allotted_project;
      } else {
        if (
          employee.allotted_project &&
          Array.isArray(employee.allotted_project)
        ) {
          updateData.allotted_project = JSON.stringify(
            employee.allotted_project,
          );
        } else if (
          employee.allotted_project === null ||
          employee.allotted_project === undefined
        ) {
          updateData.allotted_project = JSON.stringify([]);
        }
      }

      // Handle attendance_location separately
      if (final_attendence_location !== undefined) {
        updateData.attendence_location = final_attendence_location;
      } else {
        if (
          employee.attendence_location &&
          Array.isArray(employee.attendence_location)
        ) {
          updateData.attendence_location = JSON.stringify(
            employee.attendence_location,
          );
        } else if (
          employee.attendence_location === null ||
          employee.attendence_location === undefined
        ) {
          updateData.attendence_location = JSON.stringify([]);
        }
      }

      // Handle profile picture
      if (req.file) {
        if (employee.profile_picture) {
          const oldPath = path.join(__dirname, "..", employee.profile_picture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updateData.profile_picture = `/uploads/${req.file.filename}`;
      }

      const updated = await HrmsEmployee.update(id, updateData);

      // ✅ SYNC TO USER TABLE
      try {
        const { query } = require("../config/db");

        const userRows = await query(
          `SELECT id FROM users WHERE email = ? LIMIT 1`,
          [employee.email],
        );

        if (userRows && userRows.length > 0) {
          const userId = userRows[0].id;

          const userUpdateData = {};

          if (
            req.body.first_name !== undefined ||
            req.body.middle_name !== undefined ||
            req.body.last_name !== undefined
          ) {
            const firstName =
              req.body.first_name !== undefined
                ? req.body.first_name
                : employee.first_name;
            const middleName =
              req.body.middle_name !== undefined
                ? req.body.middle_name
                : employee.middle_name;
            const lastName =
              req.body.last_name !== undefined
                ? req.body.last_name
                : employee.last_name;

            userUpdateData.full_name = [firstName, middleName, lastName]
              .filter((name) => name && name.trim())
              .join(" ");
          }

          if (req.body.phone !== undefined)
            userUpdateData.phone = req.body.phone;
          if (req.file)
            userUpdateData.profile_picture = `/uploads/${req.file.filename}`;
          if (req.body.employee_status !== undefined) {
            userUpdateData.is_active =
              req.body.employee_status === "active" ? 1 : 0;
          }

          if (
            req.body.email !== undefined &&
            req.body.email !== employee.email
          ) {
            userUpdateData.email = req.body.email;
          }

          if (req.body.role_id !== undefined) {
            const roleRows = await query(
              `SELECT name FROM roles WHERE id = ? LIMIT 1`,
              [req.body.role_id],
            );
            if (roleRows && roleRows.length > 0) {
              userUpdateData.role = roleRows[0].name.toLowerCase();
            }
          }

          if (req.body.department_id !== undefined) {
            const deptRows = await query(
              `SELECT name FROM departments WHERE id = ? LIMIT 1`,
              [req.body.department_id],
            );
            if (deptRows && deptRows.length > 0) {
              userUpdateData.department = deptRows[0].name;
              userUpdateData.department_id = req.body.department_id;
            }
          }

          const fields = [];
          const values = [];

          Object.entries(userUpdateData).forEach(([key, value]) => {
            fields.push(`${key} = ?`);
            values.push(value);
          });

          if (fields.length > 0) {
            fields.push("updated_at = NOW()");
            values.push(userId);
            await query(
              `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
              values,
            );
          }
        }
      } catch (syncError) {
        console.warn("Could not sync to user:", syncError.message);
      }

      res.json(updated);
    });
  } catch (error) {
    console.error("Update employee error:", error);
    console.error("Error stack:", error.stack);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Failed to update employee",
      error: error.message,
    });
  }
};

/**
 * Update only additional details (for AddMoreDetailsModal)
 */
exports.updateAdditionalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await HrmsEmployee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updateData = {
      blood_group:
        req.body.blood_group !== undefined
          ? req.body.blood_group
          : employee.blood_group,
      date_of_birth:
        req.body.date_of_birth !== undefined
          ? req.body.date_of_birth
          : employee.date_of_birth,
      marital_status:
        req.body.marital_status !== undefined
          ? req.body.marital_status
          : employee.marital_status,
      emergency_contact:
        req.body.emergency_contact !== undefined
          ? req.body.emergency_contact
          : employee.emergency_contact,
      emergency_contact_relationship:
        req.body.emergency_contact_relationship !== undefined
          ? req.body.emergency_contact_relationship
          : employee.emergency_contact_relationship,
      emergency_contact_name:
        req.body.emergency_contact_name !== undefined
          ? req.body.emergency_contact_name
          : employee.emergency_contact_name,
      nationality:
        req.body.nationality !== undefined
          ? req.body.nationality
          : employee.nationality,
      current_address:
        req.body.current_address !== undefined
          ? req.body.current_address
          : employee.current_address,
      permanent_address:
        req.body.permanent_address !== undefined
          ? req.body.permanent_address
          : employee.permanent_address,
      city: req.body.city !== undefined ? req.body.city : employee.city,
      state: req.body.state !== undefined ? req.body.state : employee.state,
      pincode:
        req.body.pincode !== undefined ? req.body.pincode : employee.pincode,
      same_as_permanent:
        req.body.same_as_permanent !== undefined
          ? req.body.same_as_permanent === "true" ||
            req.body.same_as_permanent === true
          : employee.same_as_permanent,
      aadhar_number:
        req.body.aadhar_number !== undefined
          ? req.body.aadhar_number
          : employee.aadhar_number,
      pan_number:
        req.body.pan_number !== undefined
          ? req.body.pan_number
          : employee.pan_number,
      highest_qualification:
        req.body.highest_qualification !== undefined
          ? req.body.highest_qualification
          : employee.highest_qualification,
      university:
        req.body.university !== undefined
          ? req.body.university
          : employee.university,
      passing_year:
        req.body.passing_year !== undefined
          ? req.body.passing_year
          : employee.passing_year,
      percentage:
        req.body.percentage !== undefined
          ? req.body.percentage
          : employee.percentage,
      employee_type:
        req.body.employee_type !== undefined
          ? req.body.employee_type
          : employee.employee_type,
      probation_period:
        req.body.probation_period !== undefined
          ? req.body.probation_period
          : employee.probation_period,
      work_mode:
        req.body.work_mode !== undefined
          ? req.body.work_mode
          : employee.work_mode,
      date_of_leaving:
        req.body.date_of_leaving !== undefined
          ? req.body.date_of_leaving
          : employee.date_of_leaving,
      notice_period:
        req.body.notice_period !== undefined
          ? req.body.notice_period
          : employee.notice_period,
      salary: req.body.salary !== undefined ? req.body.salary : employee.salary,
      salary_type:
        req.body.salary_type !== undefined
          ? req.body.salary_type
          : employee.salary_type,
      laptop_assigned:
        req.body.laptop_assigned !== undefined
          ? req.body.laptop_assigned
          : employee.laptop_assigned,
      system_login_id:
        req.body.system_login_id !== undefined
          ? req.body.system_login_id
          : employee.system_login_id,
      system_password:
        req.body.system_password !== undefined
          ? req.body.system_password
          : employee.system_password,
      office_email_id:
        req.body.office_email_id !== undefined
          ? req.body.office_email_id
          : employee.office_email_id,
      office_email_password:
        req.body.office_email_password !== undefined
          ? req.body.office_email_password
          : employee.office_email_password,
      bank_account_number:
        req.body.bank_account_number !== undefined
          ? req.body.bank_account_number
          : employee.bank_account_number,
      bank_name:
        req.body.bank_name !== undefined
          ? req.body.bank_name
          : employee.bank_name,
      ifsc_code:
        req.body.ifsc_code !== undefined
          ? req.body.ifsc_code
          : employee.ifsc_code,
      upi_id: req.body.upi_id !== undefined ? req.body.upi_id : employee.upi_id,
    };

    const updated = await HrmsEmployee.update(id, updateData);
    res.json({
      success: true,
      message: "Additional details updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update additional details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update additional details",
      error: error.message,
    });
  }
};

/**
 * Create employee from user (simplified) - WITH PHONE DUPLICATE CHECK
 */
exports.createEmployeeFromUser = async (req, res) => {
  try {
    let {
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
      company_id,
      user_id,
      profile_picture = null,
    } = req.body;

    // ✅ CHECK PHONE DUPLICATE ONLY ON CREATE
    // ✅ CHECK PHONE DUPLICATE - BUT EXCLUDE IF IT'S THE SAME USER
    if (phone && phone.trim() !== "") {
      try {
        const { query } = require("../config/db");

        // Check in employees table
        const empRows = await query(
          `SELECT id FROM hrms_employees WHERE phone = ? LIMIT 1`,
          [phone],
        );

        if (empRows && empRows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "This phone number is already in use by another employee",
          });
        }

        // Check in users table - BUT EXCLUDE THE USER WE'RE CREATING FROM
        const userRows = await query(
          `SELECT id FROM users WHERE phone = ? AND email != ? LIMIT 1`,
          [phone, email], // ← This excludes the current user's email
        );

        if (userRows && userRows.length > 0) {
          return res.status(400).json({
            success: false,
            message: "This phone number is already in use by another user",
          });
        }
      } catch (phoneCheckError) {
        console.warn("Phone check failed:", phoneCheckError.message);
        // Continue with creation if check fails
      }
    }

    if (!last_name || last_name.trim() === "") {
      last_name = first_name;
    }

    // Handle allotted_project as JSON array
    let final_allotted_project = null;
    if (allotted_project) {
      if (typeof allotted_project === "string") {
        try {
          const parsed = JSON.parse(allotted_project);
          if (Array.isArray(parsed) && parsed.length > 0) {
            final_allotted_project = JSON.stringify(
              parsed.map((id) => parseInt(id)).filter(Boolean),
            );
          }
        } catch {
          if (allotted_project.includes(",")) {
            const projects = allotted_project
              .split(",")
              .map((id) => parseInt(id.trim()))
              .filter(Boolean);
            if (projects.length > 0) {
              final_allotted_project = JSON.stringify(projects);
            }
          } else {
            const num = parseInt(allotted_project);
            if (!isNaN(num)) {
              final_allotted_project = JSON.stringify([num]);
            }
          }
        }
      } else if (
        Array.isArray(allotted_project) &&
        allotted_project.length > 0
      ) {
        final_allotted_project = JSON.stringify(
          allotted_project.map((id) => parseInt(id)).filter(Boolean),
        );
      }
    }

    let final_attendence_location = attendence_location || "";
    if (attendence_location) {
      if (
        typeof attendence_location === "string" &&
        attendence_location.startsWith("[")
      ) {
        try {
          const parsed = JSON.parse(attendence_location);
          if (Array.isArray(parsed) && parsed.length > 0) {
            final_attendence_location = JSON.stringify(parsed);
          }
        } catch {
          if (attendence_location.includes(",")) {
            const locations = attendence_location
              .split(",")
              .map((loc) => loc.trim())
              .filter(Boolean);
            if (locations.length > 0) {
              final_attendence_location = JSON.stringify(locations);
            }
          } else if (attendence_location.trim() !== "") {
            final_attendence_location = JSON.stringify([
              attendence_location.trim(),
            ]);
          }
        }
      } else if (
        Array.isArray(attendence_location) &&
        attendence_location.length > 0
      ) {
        final_attendence_location = JSON.stringify(attendence_location);
      }
    }

    const requiredFields = {
      first_name: first_name,
      email: email,
      phone: phone,
      designation: designation,
      joining_date: joining_date,
      gender: gender,
      attendence_location: attendence_location,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const existing = await HrmsEmployee.findByEmail(email);
    if (existing) {
      console.log("Duplicate email found:", email);
      return res.status(409).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    const employeeData = {
      first_name,
      last_name,
      email,
      phone,
      role_id: role_id || null,
      department_id: department_id || null,
      designation,
      joining_date,
      user_id,
      gender,
      allotted_project: final_allotted_project,
      office_location: office_location || null,
      attendence_location: final_attendence_location,
      company_id: company_id || null,
      profile_picture: profile_picture || null,
      employee_status: "active",
      salary: req.body.salary || null,
      salary_type: req.body.salary_type || "monthly",
    };

    const employee = await HrmsEmployee.create(employeeData);

    const employeeCode = `EMP${String(employee.id).padStart(4, "0")}`;
    await HrmsEmployee.update(employee.id, { employee_code: employeeCode });

    employee.employee_code = employeeCode;

    res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.error("Create employee from user FULL ERROR:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error.message,
    });
  }
};

/**
 * Delete employee - ALSO DELETE USER
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await HrmsEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.profile_picture) {
      const filePath = path.join(__dirname, "..", employee.profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    try {
      const { query } = require("../config/db");
      await query(`DELETE FROM users WHERE email = ?`, [employee.email]);
    } catch (userError) {
      console.warn("Could not delete user record:", userError.message);
    }

    await HrmsEmployee.remove(id);

    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};
