const Designation = require("../models/designationModel");
const Department = require("../models/departmentModel");
const Role = require("../models/roleModel");
const { validationResult } = require("express-validator");

class DesignationController {
  // Get all designations
  static async getAllDesignations(req, res) {
    try {
      console.log("Fetching all designations...");
      const designations = await Designation.findAll();
      
      console.log(`Found ${designations.length} designations`);
      
      res.json({
        success: true,
        data: designations,
        message: "Designations fetched successfully",
        count: designations.length
      });
    } catch (error) {
      console.error("Error fetching designations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch designations",
        message: error.message
      });
    }
  }

  // Get designation by ID
  static async getDesignationById(req, res) {
    try {
      const { id } = req.params;
      const designation = await Designation.findById(id);

      if (!designation) {
        return res.status(404).json({
          success: false,
          error: "Designation not found"
        });
      }

      res.json({
        success: true,
        data: designation,
        message: "Designation fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching designation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch designation",
        message: error.message
      });
    }
  }

  // Create designation
  static async createDesignation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        name,
        department_id,
        role_id,
        hierarchy_level = 0,
        is_active = true
      } = req.body;

      console.log("Creating designation with data:", {
        name,
        department_id,
        role_id,
        hierarchy_level,
        is_active
      });

      // Verify department exists and is active
      const department = await Department.findById(department_id);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found or inactive"
        });
      }

      // Verify role exists and is active
      const role = await Role.findById(role_id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found or inactive"
        });
      }

      // Check if department has this role assigned
      const departmentRoles = await Department.getRolesByDepartment(department_id);
      const hasRole = departmentRoles.some(r => r.id === parseInt(role_id));
      
      if (!hasRole) {
        return res.status(400).json({
          success: false,
          error: "This role is not assigned to the selected department"
        });
      }

      const designation = await Designation.create({
        name,
        department_id,
        role_id,
        hierarchy_level,
        is_active,
        created_by: req.user?.id || null
      });

      console.log("Designation created successfully:", designation.id);

      res.status(201).json({
        success: true,
        data: designation,
        message: "Designation created successfully"
      });
    } catch (error) {
      console.error("Error creating designation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create designation",
        message: error.message
      });
    }
  }

  // Update designation
  static async updateDesignation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const designation = await Designation.findById(id);

      if (!designation) {
        return res.status(404).json({
          success: false,
          error: "Designation not found"
        });
      }

      const updateData = {
        ...req.body,
        updated_by: req.user?.id || null
      };

      // If name is being updated, check if it exists for same department-role
      if (req.body.name && req.body.name !== designation.name) {
        const existing = await Designation.existsInDepartmentRole(
          designation.department_id,
          designation.role_id,
          req.body.name
        );
        if (existing) {
          return res.status(409).json({
            success: false,
            error: "Designation name already exists for this department-role combination"
          });
        }
      }

      const updatedDesignation = await Designation.update(id, updateData);

      res.json({
        success: true,
        data: updatedDesignation,
        message: "Designation updated successfully"
      });
    } catch (error) {
      console.error("Error updating designation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update designation",
        message: error.message
      });
    }
  }

  // ✅ FIXED: Delete designation with proper FK constraint error handling
  static async deleteDesignation(req, res) {
    try {
      const { id } = req.params;
      const designation = await Designation.findById(id);

      if (!designation) {
        return res.status(404).json({
          success: false,
          error: "Designation not found"
        });
      }

      console.log(`Attempting to permanently delete designation: ${designation.name} (${id})`);

      const deleted = await Designation.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Designation not found or already deleted"
        });
      }

      console.log(`Designation "${designation.name}" permanently deleted successfully`);

      res.json({
        success: true,
        message: "Designation permanently deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting designation:", error);

      // ✅ Catch MySQL Foreign Key constraint errors
      // ER_ROW_IS_REFERENCED_2 (1451) = row is referenced by another table
      // ER_ROW_IS_REFERENCED (1452) = similar FK error
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451 || error.errno === 1452) {
        return res.status(409).json({
          success: false,
          error: "Cannot delete this designation because it is being used by one or more employees. Please deactivate it instead or remove the employee references first.",
          code: "FK_CONSTRAINT_ERROR"
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete designation",
        message: error.message
      });
    }
  }

  // Toggle active status
  static async toggleDesignationActive(req, res) {
    try {
      const { id } = req.params;
      console.log(`Toggling active status for designation ${id}`);
      
      const designation = await Designation.findById(id);

      if (!designation) {
        return res.status(404).json({
          success: false,
          error: "Designation not found"
        });
      }

      console.log(`Current status: ${designation.is_active ? 'Active' : 'Inactive'}`);
      
      const updatedDesignation = await Designation.toggleActive(id);
      
      console.log(`New status: ${updatedDesignation.is_active ? 'Active' : 'Inactive'}`);

      res.json({
        success: true,
        data: updatedDesignation,
        message: `Designation ${updatedDesignation.is_active ? "activated" : "deactivated"} successfully`
      });
    } catch (error) {
      console.error("Error toggling designation status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle designation status",
        message: error.message
      });
    }
  }

  // Get designations by department and role
  static async getDesignationsByDeptRole(req, res) {
    try {
      const { departmentId, roleId } = req.params;
      
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found"
        });
      }

      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found"
        });
      }

      const designations = await Designation.findByDepartmentAndRole(departmentId, roleId);

      res.json({
        success: true,
        data: designations,
        message: "Designations fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching designations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch designations",
        message: error.message
      });
    }
  }

  // Get designations by department
  static async getDesignationsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found"
        });
      }

      const designations = await Designation.findByDepartment(departmentId);

      res.json({
        success: true,
        data: designations,
        message: "Designations fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching designations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch designations",
        message: error.message
      });
    }
  }

  // Get designations by role
  static async getDesignationsByRole(req, res) {
    try {
      const { roleId } = req.params;
      
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found"
        });
      }

      const designations = await Designation.findByRole(roleId);

      res.json({
        success: true,
        data: designations,
        message: "Designations fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching designations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch designations",
        message: error.message
      });
    }
  }

  // Get statistics
  static async getDesignationStats(req, res) {
    try {
      const stats = await Designation.getStats();
      res.json({
        success: true,
        data: stats,
        message: "Designation statistics fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching designation stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
        message: error.message
      });
    }
  }

  // Search designations
  static async searchDesignations(req, res) {
    try {
      const { query } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters"
        });
      }

      const designations = await Designation.search(query.trim());

      res.json({
        success: true,
        data: designations,
        message: "Designations search completed"
      });
    } catch (error) {
      console.error("Error searching designations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search designations",
        message: error.message
      });
    }
  }

  // Get available departments for designation
  static async getAvailableDepartments(req, res) {
    try {
      const departments = await Department.findAll();
      res.json({
        success: true,
        data: Array.isArray(departments) ? departments : [],
        message: "Departments fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch departments",
        message: error.message
      });
    }
  }

  // Get roles by department for designation
  static async getRolesForDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found"
        });
      }

      const roles = await Department.getRolesByDepartment(departmentId);
      res.json({
        success: true,
        data: Array.isArray(roles) ? roles : [],
        message: "Roles fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch roles",
        message: error.message
      });
    }
  }
}

module.exports = DesignationController;