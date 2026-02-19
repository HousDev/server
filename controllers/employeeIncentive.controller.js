const EmployeeIncentiveModel = require("../models/employeeIncentive.model");

const EmployeeIncentiveController = {
  // =====================================================
  // CREATE INCENTIVE
  // =====================================================
  createIncentive: async (req, res) => {
    try {
      const {
        employee_id,
        incentive_type,
        month,
        year,
        amount,
        description,
        created_by,
      } = req.body;

      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      if (!incentive_type) {
        return res.status(400).json({ message: "Incentive type is required" });
      }

      if (!month) {
        return res.status(400).json({ message: "Month is required" });
      }

      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      if (!created_by) {
        return res.status(400).json({ message: "Created by is required" });
      }

      const id = await EmployeeIncentiveModel.createIncentive({
        employee_id,
        incentive_type,
        month,
        year,
        amount,
        description,
        created_by,
      });

      return res.status(201).json({
        message: "Incentive created successfully",
        incentive_id: id,
        success: true,
      });
    } catch (error) {
      console.error("Create Incentive Error:", error);
      return res.status(500).json({
        message: "Failed to create incentive",
      });
    }
  },

  // =====================================================
  // APPROVE
  // =====================================================
  approveIncentive: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Incentive ID is required" });
      }

      const updated = await EmployeeIncentiveModel.approveIncentive(
        id,
        approved_by,
      );

      if (!updated) {
        return res.status(404).json({ message: "Incentive not found" });
      }

      return res.status(200).json({
        message: "Incentive approved successfully",
        success: true,
      });
    } catch (error) {
      console.error("Approve Incentive Error:", error);
      return res.status(500).json({
        message: "Failed to approve incentive",
      });
    }
  },

  // =====================================================
  // REJECT
  // =====================================================
  rejectIncentive: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejected_by } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Incentive ID is required" });
      }

      const updated = await EmployeeIncentiveModel.rejectIncentive(
        id,
        rejected_by,
      );

      if (!updated) {
        return res.status(404).json({ message: "Incentive not found" });
      }

      return res.status(200).json({
        message: "Incentive rejected successfully",
        success: true,
      });
    } catch (error) {
      console.error("Reject Incentive Error:", error);
      return res.status(500).json({
        message: "Failed to reject incentive",
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
        return res.status(400).json({ message: "Incentive ID is required" });
      }

      const updated = await EmployeeIncentiveModel.markAsPaid(id);

      if (!updated) {
        return res.status(404).json({ message: "Incentive not found" });
      }

      return res.status(200).json({
        message: "Incentive marked as paid",
        success: true,
      });
    } catch (error) {
      console.error("Mark Paid Error:", error);
      return res.status(500).json({
        message: "Failed to update incentive",
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
        return res.status(400).json({ message: "Incentive ID is required" });
      }

      const data = await EmployeeIncentiveModel.getById(id);

      if (!data) {
        return res.status(404).json({ message: "Incentive not found" });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Incentive Error:", error);
      return res.status(500).json({
        message: "Failed to fetch incentive",
      });
    }
  },

  deleteIncentive: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Incentive ID is required" });
      }

      const data = await EmployeeIncentiveModel.deleteById(id);

      if (!data) {
        return res.status(404).json({ message: "Incentive not found" });
      }

      return res.status(200).json({
        data,
        success: true,
        message: "Incentive deleted successfully.",
      });
    } catch (error) {
      console.error("Get Incentive Error:", error);
      return res.status(500).json({
        message: "Failed to fetch incentive",
      });
    }
  },

  // =====================================================
  // GET EMPLOYEE INCENTIVES
  // =====================================================
  getByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;

      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const data = await EmployeeIncentiveModel.getByEmployee(employee_id);

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Employee Incentives Error:", error);
      return res.status(500).json({
        message: "Failed to fetch incentives",
      });
    }
  },

  // =====================================================
  // GET BY MONTH & YEAR (PAYROLL)
  // =====================================================
  getByMonthYear: async (req, res) => {
    try {
      const { month, year } = req.params;

      if (!month || !year) {
        return res.status(400).json({
          message: "Month and year are required",
        });
      }

      const data = await EmployeeIncentiveModel.getByMonthYear(month, year);

      return res.status(200).json({ data });
    } catch (error) {
      console.error("Get Month Year Error:", error);
      return res.status(500).json({
        message: "Failed to fetch incentives",
      });
    }
  },
  getAll: async (req, res) => {
    try {
      const data = await EmployeeIncentiveModel.getAllIncentives();
      return res.status(200).json({ data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Failed to fetch incentives",
      });
    }
  },
};

module.exports = EmployeeIncentiveController;
