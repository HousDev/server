const EmployeeAdvanceModel = require("../models/employeeAdvance.model");

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
        supporting_doc,
      } = req.body;

      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      if (!advance_amount) {
        return res.status(400).json({ message: "Advance amount is required" });
      }

      if (!installments) {
        return res.status(400).json({ message: "Installments are required" });
      }

      if (!monthly_deduction) {
        return res
          .status(400)
          .json({ message: "Monthly deduction is required" });
      }

      const id = await EmployeeAdvanceModel.createRequest({
        employee_id,
        advance_amount,
        installments,
        monthly_deduction,
        required_by,
        reason_for_advance,
        supporting_doc,
      });

      return res.status(201).json({
        message: "Advance request created successfully",
        advance_id: id,
      });
    } catch (error) {
      console.error("Create Advance Error:", error);
      return res.status(500).json({
        message: "Failed to create advance request",
      });
    }
  },

  // =====================================================
  // APPROVE
  // =====================================================
  approveAdvance: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      if (!approved_by) {
        return res.status(400).json({ message: "Approved by is required" });
      }

      const updated = await EmployeeAdvanceModel.approveAdvance(id, {
        approved_by,
      });

      if (!updated) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({
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
      const { rejected_by } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Advance ID is required" });
      }

      const updated = await EmployeeAdvanceModel.rejectAdvance(id, rejected_by);

      if (!updated) {
        return res.status(404).json({ message: "Advance not found" });
      }

      return res.status(200).json({
        message: "Advance rejected successfully",
      });
    } catch (error) {
      console.error("Reject Advance Error:", error);
      return res.status(500).json({
        message: "Failed to reject advance",
      });
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

  // =====================================================
  // GET EMPLOYEE ADVANCES
  // =====================================================
  getByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;

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
