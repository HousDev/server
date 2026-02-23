const { query } = require("../config/db");
const EmployeeAdvanceModel = require("../models/employeeAdvance.model");
const { getAll } = require("./poTypesController");

const EmployeeAdvanceController = {
  // =====================================================
  // CREATE REQUEST
  // =====================================================
  createRequest: async (req, res) => {
    try {
      const {
        employee_id,
        advance_amount,
        installments,
        monthly_deduction,
        required_by,
        reason_for_advance,
      } = req.body;

      // =========================
      // Basic Validation
      // =========================
      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      if (!advance_amount) {
        return res.status(400).json({ message: "Advance amount is required" });
      }

      if (!installments) {
        return res.status(400).json({ message: "Installments are required" });
      }

      // =========================
      // Handle Uploaded File
      // =========================
      let supporting_doc = null;

      if (req.file) {
        supporting_doc = req.file.filename;
        // or req.file.path if you want full path
      }

      // =========================
      // Save to Database
      // =========================
      const id = await EmployeeAdvanceModel.createRequest({
        employee_id,
        advance_amount,
        installments,
        required_by,
        reason_for_advance,
        supporting_doc,
      });
      return res.status(201).json({
        message: "Advance request created successfully",
        advance_id: id,
        supporting_doc,
        success: true,
      });
    } catch (error) {
      console.error("Create Advance Error:", error);

      // File type error
      if (error.message?.includes("Only JPG")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      // File size error
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File size must be less than 5MB",
        });
      }

      return res.status(500).json({
        message: "Failed to create advance requests",
      });
    }
  },

  // =====================================================
  // APPROVE
  // =====================================================
  approveAdvance: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by, remark } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      if (!approved_by) {
        return res.status(400).json({ message: "Approved by is required" });
      }

      const updated = await EmployeeAdvanceModel.approveAdvance(id, {
        approved_by,
        remark,
      });

      if (!updated) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Advance approved successfully",
      });
    } catch (error) {
      console.error("Approve Advance Error:", error);
      return res.status(500).json({
        message: "Failed to approve advance",
      });
    }
  },

  // =====================================================
  // REJECT
  // =====================================================
  rejectAdvance: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejected_by, remark } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      const updated = await EmployeeAdvanceModel.rejectAdvance(
        id,
        rejected_by,
        remark,
      );

      if (!updated) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({
        message: "Advance rejected successfully",
        success: true,
      });
    } catch (error) {
      console.error("Reject Advance Error:", error);
      return res.status(500).json({
        message: "Failed to reject advance",
      });
    }
  },

  // =====================================================
  // get all
  // =====================================================
  getAll: async (req, res) => {
    try {
      const data = await EmployeeAdvanceModel.getAllAdvance();

      return res.status(200).json({ message: "Data Loaded", data: data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal Server Error." });
    }
  },

  // =====================================================
  // MARK DISBURSED
  // =====================================================
  markDisbursed: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      const updated = await EmployeeAdvanceModel.markDisbursed(id);

      if (!updated) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({
        message: "Advance marked as disbursed",
        success: true,
      });
    } catch (error) {
      console.error("Disburse Error:", error);
      return res.status(500).json({
        message: "Failed to update disbursement",
      });
    }
  },

  // =====================================================
  // GET SINGLE
  // =====================================================
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      const data = await EmployeeAdvanceModel.getById(id);

      if (!data) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Advance Error:", error);
      return res.status(500).json({
        message: "Failed to fetch advance",
      });
    }
  },

  deleteAdvance: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      const data = await EmployeeAdvanceModel.deleteAdvance(id);

      if (!data) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res
        .status(200)
        .json({ message: "Advance deleted.", success: true });
    } catch (error) {
      console.error("Get Advance Error:", error);
      return res.status(500).json({
        message: "Failed to delete advance",
      });
    }
  },

  // =====================================================
  // GET EMPLOYEE ADVANCES
  // =====================================================
  getByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;
      console.log(employee_id);

      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const data = await EmployeeAdvanceModel.getByEmployee(employee_id);

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Employee Advances Error:", error);
      return res.status(500).json({
        message: "Failed to fetch advances",
      });
    }
  },

  // =====================================================
  // CLOSE ADVANCE
  // =====================================================
  closeAdvance: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      const updated = await EmployeeAdvanceModel.closeAdvance(id);

      if (!updated) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({
        message: "Advance closed successfully",
      });
    } catch (error) {
      console.error("Close Advance Error:", error);
      return res.status(500).json({
        message: "Failed to close advance",
      });
    }
  },
};

module.exports = EmployeeAdvanceController;
