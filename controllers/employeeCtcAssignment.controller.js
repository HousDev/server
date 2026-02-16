const EmployeeCTCAssignmentModel = require("../models/employeeCtcAssignment.model");

const EmployeeCTCAssignmentController = {
  // =====================================================
  // ASSIGN TEMPLATE TO EMPLOYEE
  // =====================================================
  assignTemplate: async (req, res) => {
    try {
      const { employee_id, template_id, ctc_amount, effective_from } = req.body;

      if (!employee_id) {
        return res.status(400).json({
          message: "Employee ID is required",
        });
      }

      if (!template_id) {
        return res.status(400).json({
          message: "Template ID is required",
        });
      }

      if (!ctc_amount) {
        return res.status(400).json({
          message: "CTC amount is required",
        });
      }

      if (!effective_from) {
        return res.status(400).json({
          message: "Effective date is required",
        });
      }

      const id = await EmployeeCTCAssignmentModel.assignTemplate({
        employee_id,
        template_id,
        ctc_amount,
        effective_from,
      });

      return res.status(201).json({
        message: "CTC assigned successfully",
        assignment_id: id,
      });
    } catch (error) {
      console.error("Assign CTC Error:", error);
      return res.status(500).json({
        message: "Failed to assign CTC",
      });
    }
  },

  // =====================================================
  // UPDATE ASSIGNMENT
  // =====================================================
  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { template_id, ctc_amount, effective_from } = req.body;

      if (!id) {
        return res.status(400).json({
          message: "Assignment ID is required",
        });
      }

      if (!template_id) {
        return res.status(400).json({
          message: "Template ID is required",
        });
      }

      if (!ctc_amount) {
        return res.status(400).json({
          message: "CTC amount is required",
        });
      }

      if (!effective_from) {
        return res.status(400).json({
          message: "Effective date is required",
        });
      }

      const updated = await EmployeeCTCAssignmentModel.updateAssignment(id, {
        template_id,
        ctc_amount,
        effective_from,
      });

      if (!updated) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      return res.status(200).json({
        message: "Assignment updated successfully",
      });
    } catch (error) {
      console.error("Update Assignment Error:", error);
      return res.status(500).json({
        message: "Failed to update assignment",
      });
    }
  },

  // =====================================================
  // GET CURRENT ASSIGNMENT
  // =====================================================
  getByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;

      if (!employee_id) {
        return res.status(400).json({
          message: "Employee ID is required",
        });
      }

      const data = await EmployeeCTCAssignmentModel.getByEmployee(employee_id);

      if (!data) {
        return res.status(404).json({
          message: "No assignment found",
        });
      }

      return res.status(200).json({
        data,
      });
    } catch (error) {
      console.error("Get Assignment Error:", error);
      return res.status(500).json({
        message: "Failed to fetch assignment",
      });
    }
  },

  // =====================================================
  // GET FULL HISTORY
  // =====================================================
  getHistoryByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;

      if (!employee_id) {
        return res.status(400).json({
          message: "Employee ID is required",
        });
      }

      const data =
        await EmployeeCTCAssignmentModel.getHistoryByEmployee(employee_id);

      return res.status(200).json({
        data,
      });
    } catch (error) {
      console.error("Get History Error:", error);
      return res.status(500).json({
        message: "Failed to fetch history",
      });
    }
  },

  // =====================================================
  // DELETE ASSIGNMENT
  // =====================================================
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "Assignment ID is required",
        });
      }

      const deleted = await EmployeeCTCAssignmentModel.deleteAssignment(id);

      if (!deleted) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      return res.status(200).json({
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Delete Assignment Error:", error);
      return res.status(500).json({
        message: "Failed to delete assignment",
      });
    }
  },
};

module.exports = EmployeeCTCAssignmentController;
