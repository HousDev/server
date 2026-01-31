// controllers/roleController.js
const { query } = require("../config/db");
const Role = require("../models/roleModel");
const { validationResult } = require("express-validator");

class RoleController {
  // Get all roles
  static async getAllRoles(req, res) {
    try {
      const roles = await Role.findAll();
      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch roles",
        message: error.message,
      });
    }
  }

  // Get paginated roles
  static async getRolesPaginated(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, search, is_active } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      if (search) options.search = search;
      if (is_active !== undefined) {
        options.is_active = is_active === "true" || is_active === "1";
      }

      const result = await Role.findAllPaginated(options);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error fetching paginated roles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch roles",
        message: error.message,
      });
    }
  }

  // Get role by ID
  static async getRoleById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const role = await Role.findById(req.params.id);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found",
        });
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      console.error("Error fetching role by ID:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch role",
        message: error.message,
      });
    }
  }

  // ✅ FIXED: Create new role
  static async createRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const roleData = {
        name: req.body.name.toLowerCase(),
        description: req.body.description,
        permissions: req.body.permissions || {},
        is_active: req.body.is_active !== false,
      };

      // Check if role name already exists
      const existingRole = await Role.findByName(roleData.name);
      if (existingRole) {
        return res.status(409).json({
          success: false,
          error: "Role name already exists",
        });
      }

      // ✅ Use Role model's create method, NOT db.execute
      const newRole = await Role.create(roleData);

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: newRole,
      });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create role",
        message: error.message,
      });
    }
  }

  // Update role
  static async updateRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const roleId = req.params.id;
      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found",
        });
      }

      const updateData = {};
      if (req.body.name !== undefined)
        updateData.name = req.body.name.toLowerCase();
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.permissions !== undefined)
        updateData.permissions = req.body.permissions;
      if (req.body.is_active !== undefined)
        updateData.is_active = req.body.is_active;

      // Check if new name already exists (if name is being updated)
      if (req.body.name && req.body.name !== role.name) {
        const existingRole = await Role.findByName(req.body.name);
        if (existingRole) {
          return res.status(409).json({
            success: false,
            error: "Role name already exists",
          });
        }
      }

      const updatedRole = await Role.update(roleId, updateData);

      res.json({
        success: true,
        message: "Role updated successfully",
        data: updatedRole,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update role",
        message: error.message,
      });
    }
  }

  // Delete role
  static async deleteRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const roleId = req.params.id;
      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found",
        });
      }

      await Role.delete(roleId);

      res.json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete role",
        message: error.message,
      });
    }
  }

  // Toggle role active status
  static async toggleRoleActive(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const roleId = req.params.id;
      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found",
        });
      }

      const updatedRole = await Role.toggleActive(roleId);

      res.json({
        success: true,
        message: `Role ${updatedRole.is_active ? "activated" : "deactivated"} successfully`,
        data: updatedRole,
      });
    } catch (error) {
      console.error("Error toggling role active status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle role status",
        message: error.message,
      });
    }
  }

  // Get role by name
  static async getRoleByName(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const role = await Role.findByName(req.params.name);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: "Role not found",
        });
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      console.error("Error fetching role by name:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch role",
        message: error.message,
      });
    }
  }

  // Get role statistics
  static async getRoleStats(req, res) {
    try {
      const stats = await Role.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching role stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch role statistics",
        message: error.message,
      });
    }
  }
  static async updateRolePermissions(req, res) {
    const roleId = req.params.roleId;
    try {
      const { permissions } = req.body;
      if (!roleId) {
        return res.json("Role id required.");
      }
      const existingRole = await Role.findById(roleId);
      if (!existingRole) {
        return res.json("Role not exisisted.");
      }
      const updatedRole = await query(
        "UPDATE roles set permissions = ? WHERE id = ?",
        [permissions, roleId],
      );

      res.json({
        success: true,
        message: "Role permissions updated.",
        data: updatedRole,
      });
    } catch (error) {
      console.error("Error fetching role stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch role statistics",
        message: error.message,
      });
    }
  }
  // Get all permissions
  static async getAllPermissions(req, res) {
    try {
      const permissions = await Role.getAllPermissions();
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      console.error("Error fetching all permissions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch permissions",
        message: error.message,
      });
    }
  }

  // Search roles
  static async searchRoles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { q, limit = 10 } = req.query;
      const roles = await Role.search(q, parseInt(limit));

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.error("Error searching roles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search roles",
        message: error.message,
      });
    }
  }
}

module.exports = RoleController;
