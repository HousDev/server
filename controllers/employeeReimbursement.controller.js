const EmployeeReimbursementModel = require("../models/employeeReimbursement.model");

const EmployeeReimbursementController = {
  // =====================================================
  // CREATE
  // =====================================================
  createRequest: async (req, res) => {
    try {
      const { employee_id, category, amount, description, doc } = req.body;

      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const id = await EmployeeReimbursementModel.createRequest({
        employee_id,
        category,
        amount,
        description,
        doc,
      });

      return res.status(201).json({
        message: "Reimbursement created successfully",
        reimbursement_id: id,
      });
    } catch (error) {
      console.error("Create Reimbursement Error:", error);
      return res.status(500).json({
        message: "Failed to create reimbursement",
      });
    }
  },

  // =====================================================
  // UPDATE (ONLY IF PENDING)
  // =====================================================
  updateRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { category, amount, description, doc } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Reimbursement ID is required" });
      }

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const updated = await EmployeeReimbursementModel.updateRequest(id, {
        category,
        amount,
        description,
        doc,
      });

      if (!updated) {
        return res.status(400).json({
          message:
            "Cannot update. Either record not found or not in pending state",
        });
      }

      return res.status(200).json({
        message: "Reimbursement updated successfully",
      });
    } catch (error) {
      console.error("Update Reimbursement Error:", error);
      return res.status(500).json({
        message: "Failed to update reimbursement",
      });
    }
  },

  // =====================================================
  // APPROVE
  // =====================================================
  approveRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Reimbursement ID is required" });
      }

      if (!approved_by) {
        return res.status(400).json({ message: "Approved by is required" });
      }

      const updated = await EmployeeReimbursementModel.approveRequest(id, {
        approved_by,
      });

      if (!updated) {
        return res.status(404).json({ message: "Reimbursement not found" });
      }

      return res.status(200).json({
        message: "Reimbursement approved successfully",
      });
    } catch (error) {
      console.error("Approve Reimbursement Error:", error);
      return res.status(500).json({
        message: "Failed to approve reimbursement",
      });
    }
  },

  // =====================================================
  // REJECT
  // =====================================================
  rejectRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejected_by } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Reimbursement ID is required" });
      }

      const updated = await EmployeeReimbursementModel.rejectRequest(
        id,
        rejected_by,
      );

      if (!updated) {
        return res.status(404).json({ message: "Reimbursement not found" });
      }

      return res.status(200).json({
        message: "Reimbursement rejected successfully",
      });
    } catch (error) {
      console.error("Reject Reimbursement Error:", error);
      return res.status(500).json({
        message: "Failed to reject reimbursement",
      });
    }
  },

  // =====================================================
  // MARK AS PAID
  // =====================================================
  markAsPaid: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Reimbursement ID is required" });
      }

      const updated = await EmployeeReimbursementModel.markAsPaid(id);

      if (!updated) {
        return res.status(404).json({ message: "Reimbursement not found" });
      }

      return res.status(200).json({
        message: "Reimbursement marked as paid",
      });
    } catch (error) {
      console.error("Mark Paid Error:", error);
      return res.status(500).json({
        message: "Failed to update reimbursement",
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
        return res
          .status(400)
          .json({ message: "Reimbursement ID is required" });
      }

      const data = await EmployeeReimbursementModel.getById(id);

      if (!data) {
        return res.status(404).json({ message: "Reimbursement not found" });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Reimbursement Error:", error);
      return res.status(500).json({
        message: "Failed to fetch reimbursement",
      });
    }
  },

  // =====================================================
  // GET EMPLOYEE REQUESTS
  // =====================================================
  getByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;

      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const data = await EmployeeReimbursementModel.getByEmployee(employee_id);

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Employee Reimbursements Error:", error);
      return res.status(500).json({
        message: "Failed to fetch reimbursements",
      });
    }
  },

  // =====================================================
  // GET APPROVED (PAYROLL)
  // =====================================================
  getApproved: async (req, res) => {
    try {
      const data = await EmployeeReimbursementModel.getApproved();

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Approved Error:", error);
      return res.status(500).json({
        message: "Failed to fetch reimbursements",
      });
    }
  },

  // =====================================================
  // GET SINGLE
  // =====================================================
  deleteById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Reimbursement ID is required" });
      }

      const data = await EmployeeReimbursementModel.deleteById(id);

      if (!data) {
        return res
          .status(404)
          .json({ message: "Failed to delete reimbursement." });
      }

      return res
        .status(200)
        .json({ message: "Successfully deleted reimbursement." });
    } catch (error) {
      console.error("Get Reimbursement Error:", error);
      return res.status(500).json({
        message: "Failed to fetch reimbursement",
      });
    }
  },
};

module.exports = EmployeeReimbursementController;
