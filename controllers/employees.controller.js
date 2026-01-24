
// backend/controllers/employees.controller.js
const upload = require("../middleware/upload");
const HrmsEmployee = require("../models/employees.model");
const fs = require("fs");
const path = require("path");

/**
 * Get all employees
 */
// In backend/controllers/employees.controller.js
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await HrmsEmployee.findAll();
    console.log("Fetched employees from DB:", employees.length);
    
    // Make sure we're returning an array
    if (Array.isArray(employees)) {
      res.json(employees);
    } else {
      console.error("Employees is not an array:", employees);
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
 * Create employee with profile picture
 */
exports.createEmployee = async (req, res) => {
  try {
    // Handle file upload
    upload.single('profile_picture')(req, res, async function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

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
        office_location,
        attendence_location,
      } = req.body;

      // Basic validation (same as before)
      if (
        !first_name ||
        !last_name ||
        !email ||
        !phone ||
        !role_id ||
        !department_id ||
        !designation ||
        !joining_date ||
        !gender ||
        !allotted_project ||
        !attendence_location
      ) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          message: "All required fields must be provided",
        });
      }

      // Prevent duplicate email
      const existing = await HrmsEmployee.findByEmail(email);
      if (existing) {
        // Delete uploaded file if email exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(409).json({
          message: "Employee with this email already exists",
        });
      }

      // Prepare employee data with profile picture path
      const employeeData = {
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
        office_location: office_location || null,
        attendence_location,
        profile_picture: req.file ? `/uploads/${req.file.filename}` : null
      };

      const employee = await HrmsEmployee.create(employeeData);
      res.status(201).json(employee);
    });
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ message: "Failed to create employee" });
  }
};

/**
 * Update employee with profile picture
 */
exports.updateEmployee = async (req, res) => {
  try {
    // Handle file upload
    upload.single('profile_picture')(req, res, async function(err) {
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

      // Prepare update data with profile picture
      const updateData = { ...req.body };
      if (req.file) {
        // Delete old profile picture if exists
        if (employee.profile_picture) {
          const oldPath = path.join(__dirname, '..', employee.profile_picture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updateData.profile_picture = `/uploads/${req.file.filename}`;
      }

      const updated = await HrmsEmployee.update(id, updateData);
      res.json(updated);
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ message: "Failed to update employee" });
  }
};



// backend/controllers/employees.controller.js - Update createEmployeeFromUser

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
      profile_picture = null
      // REMOVED: employee_status, employee_code, user_id
    } = req.body;

    console.log("Received employee data:", req.body);

    // If last_name is empty, use first_name
    if (!last_name || last_name.trim() === '') {
      last_name = first_name;
    }

    // Basic validation
    if (!first_name || !email || !phone || !designation || 
        !joining_date || !gender || !attendence_location) {
      
      const missing = [];
      if (!first_name) missing.push('first_name');
      if (!email) missing.push('email');
      if (!phone) missing.push('phone');
      if (!designation) missing.push('designation');
      if (!joining_date) missing.push('joining_date');
      if (!gender) missing.push('gender');
      if (!attendence_location) missing.push('attendence_location');
      
      console.error("Missing fields:", missing);
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Check for duplicate email
    const existing = await HrmsEmployee.findByEmail(email);
    if (existing) {
      console.log("Duplicate email found:", email);
      return res.status(409).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // Prepare employee data - ONLY columns that exist in your table
    const employeeData = {
      first_name,
      last_name,
      email,
      phone,
      role_id: role_id || null,
      department_id: department_id || null,
      designation,
      joining_date,
      gender,
      allotted_project: allotted_project || null,
      office_location: office_location || null,
      attendence_location,
      profile_picture: profile_picture || null
    };

    console.log("Creating employee with data:", employeeData);

    const employee = await HrmsEmployee.create(employeeData);
    
    console.log("Employee created successfully:", employee);
    
    res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully"
    });
  } catch (error) {
    console.error("Create employee from user FULL ERROR:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false,
      message: "Failed to create employee",
      error: error.message
    });
  }
};


/**
 * Delete employee
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await HrmsEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete profile picture if exists
    if (employee.profile_picture) {
      const filePath = path.join(__dirname, '..', employee.profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await HrmsEmployee.remove(id);
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};