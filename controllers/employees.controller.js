const HrmsEmployee = require("../models/employees.model");

/**
 * Get all employees
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await HrmsEmployee.findAll();
    res.json(employees);
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
 * Create employee
 */
exports.createEmployee = async (req, res) => {
  try {
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
      attendence_location,
    } = req.body;

    // Basic validation
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
      return res.status(400).json({
        message: "All required fields must be provided",
      });
    }

    // Prevent duplicate email
    const existing = await HrmsEmployee.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        message: "Employee with this email already exists",
      });
    }

    const employee = await HrmsEmployee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ message: "Failed to create employee" });
  }
};

/**
 * Update employee
 */
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await HrmsEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // If email is being updated, check uniqueness
    if (req.body.email && req.body.email !== employee.email) {
      const existing = await HrmsEmployee.findByEmail(req.body.email);
      if (existing) {
        return res.status(409).json({
          message: "Email already in use by another employee",
        });
      }
    }

    const updated = await HrmsEmployee.update(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ message: "Failed to update employee" });
  }
};

/**
 * Delete employee
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const employee = await HrmsEmployee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await HrmsEmployee.remove(id);
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};
