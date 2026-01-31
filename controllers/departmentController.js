// // controllers/departmentController.js
// const Department = require("../models/departmentModel");
// const { validationResult } = require("express-validator");

// class DepartmentController {
//   // Get all departments
//   static async getAllDepartments(req, res) {
//     try {
//       const departments = await Department.findAll();
//       res.json({
//         success: true,
//         data: departments,
//         message: "Departments fetched successfully",
//       });
//     } catch (error) {
//       console.error("Error fetching departments:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to fetch departments",
//         message: error.message,
//       });
//     }
//   }

//   // Get department by ID
//   static async getDepartmentById(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array(),
//         });
//       }

//       const department = await Department.findById(req.params.id);

//       if (!department) {
//         return res.status(404).json({
//           success: false,
//           error: "Department not found",
//         });
//       }

//       res.json({
//         success: true,
//         data: department,
//         message: "Department fetched successfully",
//       });
//     } catch (error) {
//       console.error("Error fetching department:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to fetch department",
//         message: error.message,
//       });
//     }
//   }

//   // Create new department
//   static async createDepartment(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array(),
//         });
//       }

//       const departmentData = {
//         name: req.body.name,
//         code: req.body.code,
//         description: req.body.description || null,
//         manager_id: req.body.manager_id || null,
//         is_active: req.body.is_active !== false,
//       };

//       // Check if department code already exists
//       const existingDept = await Department.findByCode(departmentData.code);
//       if (existingDept) {
//         return res.status(409).json({
//           success: false,
//           error: "Department code already exists",
//         });
//       }

//       const newDepartment = await Department.create(departmentData);

//       res.status(201).json({
//         success: true,
//         data: newDepartment,
//         message: "Department created successfully",
//       });
//     } catch (error) {
//       console.error("Error creating department:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to create department",
//         message: error.message,
//       });
//     }
//   }

//   // Update department
//   static async updateDepartment(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array(),
//         });
//       }

//       const departmentId = req.params.id;
//       const department = await Department.findById(departmentId);

//       if (!department) {
//         return res.status(404).json({
//           success: false,
//           error: "Department not found",
//         });
//       }

//       const updateData = {};
//       if (req.body.name !== undefined) updateData.name = req.body.name;
//       if (req.body.code !== undefined) updateData.code = req.body.code;
//       if (req.body.description !== undefined)
//         updateData.description = req.body.description;
//       if (req.body.manager_id !== undefined)
//         updateData.manager_id = req.body.manager_id;
//       if (req.body.is_active !== undefined)
//         updateData.is_active = req.body.is_active;

//       // Check if new code already exists (if code is being updated)
//       if (req.body.code && req.body.code !== department.code) {
//         const existingDept = await Department.findByCode(req.body.code);
//         if (existingDept) {
//           return res.status(409).json({
//             success: false,
//             error: "Department code already exists",
//           });
//         }
//       }

//       const updatedDepartment = await Department.update(
//         departmentId,
//         updateData,
//       );

//       res.json({
//         success: true,
//         data: updatedDepartment,
//         message: "Department updated successfully",
//       });
//     } catch (error) {
//       console.error("Error updating department:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to update department",
//         message: error.message,
//       });
//     }
//   }

//   // Delete department (soft delete)
//   static async deleteDepartment(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array(),
//         });
//       }

//       const departmentId = req.params.id;
//       const department = await Department.findById(departmentId);

//       if (!department) {
//         return res.status(404).json({
//           success: false,
//           error: "Department not found",
//         });
//       }

//       await Department.delete(departmentId);

//       res.json({
//         success: true,
//         message: "Department deleted successfully",
//       });
//     } catch (error) {
//       console.error("Error deleting department:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to delete department",
//         message: error.message,
//       });
//     }
//   }

//   // Toggle department active status
//   static async toggleDepartmentActive(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array(),
//         });
//       }

//       const departmentId = req.params.id;
//       const department = await Department.findById(departmentId);

//       if (!department) {
//         return res.status(404).json({
//           success: false,
//           error: "Department not found",
//         });
//       }

//       const updatedDepartment = await Department.toggleActive(departmentId);

//       res.json({
//         success: true,
//         data: updatedDepartment,
//         message: `Department ${updatedDepartment.is_active ? "activated" : "deactivated"} successfully`,
//       });
//     } catch (error) {
//       console.error("Error toggling department active status:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to toggle department status",
//         message: error.message,
//       });
//     }
//   }

//   // Search departments
//   static async searchDepartments(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array(),
//         });
//       }

//       const { query } = req.query;

//       if (!query || typeof query !== "string") {
//         return res.status(400).json({
//           success: false,
//           error: "Search query is required",
//         });
//       }

//       const departments = await Department.search(query);

//       res.json({
//         success: true,
//         data: departments,
//         message: "Departments search completed",
//       });
//     } catch (error) {
//       console.error("Error searching departments:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to search departments",
//         message: error.message,
//       });
//     }
//   }

//   // Get active managers
//   static async getActiveManagers(req, res) {
//     try {
//       const managers = await Department.getActiveManagers();

//       res.json({
//         success: true,
//         data: managers,
//         message: "Managers fetched successfully",
//       });
//     } catch (error) {
//       console.error("Error fetching managers:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to fetch managers",
//         message: error.message,
//       });
//     }
//   }

//   // Get department statistics
//   static async getDepartmentStats(req, res) {
//     try {
//       const stats = await Department.getStats();

//       res.json({
//         success: true,
//         data: stats,
//         message: "Department statistics fetched successfully",
//       });
//     } catch (error) {
//       console.error("Error fetching department statistics:", error);
//       res.status(500).json({
//         success: false,
//         error: "Failed to fetch department statistics",
//         message: error.message,
//       });
//     }
//   }
// }

// module.exports = DepartmentController;

const Department = require("../models/departmentModel");
const { validationResult } = require("express-validator");

class DepartmentController {
  // Get all departments WITH roles
  static async getAllDepartments(req, res) {
    try {
      const departments = await Department.findAll();
      res.json({
        success: true,
        data: departments,
        message: "Departments fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch departments",
        message: error.message,
      });
    }
  }

  // Get department by ID WITH roles
  static async getDepartmentById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const department = await Department.findById(req.params.id);

      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      res.json({
        success: true,
        data: department,
        message: "Department fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch department",
        message: error.message,
      });
    }
  }

  // Create department WITH roles
  static async createDepartment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const departmentData = {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description || null,
        manager_id: req.body.manager_id || null,
        is_active: req.body.is_active !== false,
        role_ids: req.body.role_ids || []
      };

      // Check if department code already exists
      const existingDept = await Department.findByCode(departmentData.code);
      if (existingDept) {
        return res.status(409).json({
          success: false,
          error: "Department code already exists",
        });
      }

      // Validate role_ids if provided
      if (departmentData.role_ids && departmentData.role_ids.length > 0) {
        if (!Array.isArray(departmentData.role_ids)) {
          return res.status(400).json({
            success: false,
            error: "role_ids must be an array",
          });
        }

        // Validate each role_id is a number
        const invalidRoleIds = departmentData.role_ids.filter(id => isNaN(parseInt(id)));
        if (invalidRoleIds.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid role IDs: ${invalidRoleIds.join(', ')}`,
          });
        }
      }

      // Create department with roles
      const newDepartment = await Department.createWithRoles(departmentData);

      res.status(201).json({
        success: true,
        data: newDepartment,
        message: "Department created successfully with assigned roles",
      });
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create department",
        message: error.message,
      });
    }
  }

  // Update department WITH roles
  static async updateDepartment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const departmentId = req.params.id;
      const department = await Department.findById(departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      const updateData = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.code !== undefined) updateData.code = req.body.code;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.manager_id !== undefined) updateData.manager_id = req.body.manager_id;
      if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;
      
      if (req.body.role_ids !== undefined) {
        updateData.role_ids = req.body.role_ids || [];
        
        if (updateData.role_ids.length > 0) {
          if (!Array.isArray(updateData.role_ids)) {
            return res.status(400).json({
              success: false,
              error: "role_ids must be an array",
            });
          }

          const invalidRoleIds = updateData.role_ids.filter(id => isNaN(parseInt(id)));
          if (invalidRoleIds.length > 0) {
            return res.status(400).json({
              success: false,
              error: `Invalid role IDs: ${invalidRoleIds.join(', ')}`,
            });
          }
        }
      }

      if (req.body.code && req.body.code !== department.code) {
        const existingDept = await Department.findByCode(req.body.code);
        if (existingDept) {
          return res.status(409).json({
            success: false,
            error: "Department code already exists",
          });
        }
      }

      const updatedDepartment = await Department.updateWithRoles(departmentId, updateData);

      res.json({
        success: true,
        data: updatedDepartment,
        message: "Department updated successfully",
      });
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update department",
        message: error.message,
      });
    }
  }

  // Delete department (soft delete)
  static async deleteDepartment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const departmentId = req.params.id;
      const department = await Department.findById(departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      await Department.delete(departmentId);

      res.json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete department",
        message: error.message,
      });
    }
  }

  // Toggle department active status
  static async toggleDepartmentActive(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const departmentId = req.params.id;
      const department = await Department.findById(departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      const updatedDepartment = await Department.toggleActive(departmentId);

      res.json({
        success: true,
        data: updatedDepartment,
        message: `Department ${updatedDepartment.is_active ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling department active status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle department status",
        message: error.message,
      });
    }
  }

  // Search departments WITH roles
  static async searchDepartments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      const departments = await Department.search(query);

      res.json({
        success: true,
        data: departments,
        message: "Departments search completed",
      });
    } catch (error) {
      console.error("Error searching departments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search departments",
        message: error.message,
      });
    }
  }

  // Get active managers
  static async getActiveManagers(req, res) {
    try {
      const managers = await Department.getActiveManagers();

      res.json({
        success: true,
        data: managers,
        message: "Managers fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching managers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch managers",
        message: error.message,
      });
    }
  }

  // Get department statistics
  static async getDepartmentStats(req, res) {
    try {
      const stats = await Department.getStats();

      res.json({
        success: true,
        data: stats,
        message: "Department statistics fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching department statistics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch department statistics",
        message: error.message,
      });
    }
  }

  // Get available roles for department creation
  static async getAvailableRoles(req, res) {
    try {
      const roles = await Department.getAvailableRoles();
      
      res.json({
        success: true,
        data: roles,
        message: "Available roles fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching available roles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch available roles",
        message: error.message
      });
    }
  }

  // Get roles by department
  static async getRolesByDepartment(req, res) {
    try {
      const { id } = req.params;
      const roles = await Department.getRolesByDepartment(id);
      
      res.json({
        success: true,
        data: roles,
        message: "Department roles fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching department roles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch department roles",
        message: error.message
      });
    }
  }
}

module.exports = DepartmentController;