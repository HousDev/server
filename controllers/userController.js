// controllers/userController.js
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const UserModel = require("../models/userModel");
const RoleModel = require("../models/roleModel");

// ✅ Password और sensitive data remove करें
const scrub = (user) => {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
};

// ✅ सभी users get करें
async function getAllUsers(req, res) {
  try {
    const users = await UserModel.findAll();
    res.json({
      success: true,
      data: users.map(scrub),
      message: "Users fetched successfully",
      count: users.length,
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: err.message,
    });
  }
}

async function getAllUsersByRole(req, res) {
  try {
    const role = req.params.role;
    const users = await UserModel.findAllByRole(role);
    res.json(users.map(scrub));
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// ✅ ID से user get करें
async function getUserById(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get role permissions
    let rolePermissions = {};
    try {
      const role = await RoleModel.getRoleByName(user.role);
      if (role) {
        rolePermissions = role.permissions || {};
      }
    } catch (roleError) {
      console.warn("Could not fetch role permissions:", roleError.message);
    }

    res.json({
      success: true,
      data: {
        ...scrub(user),
        permissions: rolePermissions,
      },
      message: "User fetched successfully",
    });
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user",
      message: err.message,
    });
  }
}

// ✅ नया user create करें (FIXED)
async function createUser(req, res) {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      email,
      full_name,
      phone,
      role = "USER",
      department,
      password,
      is_active = true,
      permissions = {},
    } = req.body;

    console.log("Create user request body:", req.body);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // Check if user already exists
    const existing = await UserModel.findByEmailWithPassword(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "A user with this email already exists",
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user with safe values
    const created = await UserModel.create({
      email: email.trim(),
      full_name: full_name || null,
      phone: phone || null,
      role: role.toUpperCase(),
      department: department || null,
      password: hash,
      is_active: is_active !== false,
      permissions: permissions || {},
    });

    console.log("User created successfully:", created);

    // Check if role exists, if not create it
    try {
      const existingRole = await RoleModel.getRoleByName(role);
      if (!existingRole) {
        // Create default permissions for new role
        const defaultPermissions = {
          view_dashboard: true,
          view_service_orders: true,
        };
        await RoleModel.createRole({
          name: role,
          description: `Auto-created role for ${role}`,
          permissions: defaultPermissions,
          is_active: true,
          created_by: "system",
        });
        console.log("Auto-created role:", role);
      }
    } catch (roleError) {
      console.warn("Could not check/create role:", roleError.message);
    }

    res.status(201).json({
      success: true,
      data: scrub(created),
      message: "User created successfully",
    });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: err.message,
      details: err.stack,
    });
  }
}

// ✅ User update करें (FIXED)
async function updateUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const {
      full_name,
      phone,
      role,
      department,
      password,
      is_active,
      permissions,
    } = req.body;

    console.log("Update user request:", { id, body: req.body });

    // Prepare update data with safe values
    const updateData = {};

    if (full_name !== undefined) updateData.full_name = full_name || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role.toUpperCase();
    if (department !== undefined) updateData.department = department || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (permissions !== undefined) updateData.permissions = permissions || {};

    // Hash new password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updated = await UserModel.update(id, updateData);

    res.json({
      success: true,
      data: scrub(updated),
      message: "User updated successfully",
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
      message: err.message,
    });
  }
}

// ✅ User delete करें
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Prevent self-deletion (optional)
    if (req.user && req.user.userId === id) {
      return res.status(400).json({
        success: false,
        error: "You cannot delete your own account",
      });
    }

    await UserModel.remove(id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
      message: err.message,
    });
  }
}

// ✅ Active status toggle करें
async function toggleActive(req, res) {
  try {
    const { id } = req.params;
    const user = await UserModel.toggleActive(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: scrub(user),
      message: `User ${user.is_active ? "activated" : "deactivated"} successfully`,
    });
  } catch (err) {
    console.error("toggleActive error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to toggle active status",
      message: err.message,
    });
  }
}

// ✅ User permissions update करें
const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!userId || permissions === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID and permissions are required",
      });
    }

    const existing = await UserModel.findById(userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user permissions
    const user = await UserModel.updateUserPermissions(userId, permissions);

    return res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      data: scrub(user),
    });
  } catch (error) {
    console.error("updateUserPermissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Login function
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user with password
    const user = await UserModel.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Get role permissions
    let rolePermissions = {};
    try {
      const role = await RoleModel.getRoleByName(user.role);
      if (role) {
        rolePermissions = role.permissions || {};
      }
    } catch (roleError) {
      console.warn("Could not fetch role permissions:", roleError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        user: scrub(user),
        permissions: rolePermissions,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
}

// ✅ Get user profile
async function getProfile(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get role permissions
    let rolePermissions = {};
    try {
      const role = await RoleModel.getRoleByName(user.role);
      if (role) {
        rolePermissions = role.permissions || {};
      }
    } catch (roleError) {
      console.warn("Could not fetch role permissions:", roleError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        ...scrub(user),
        permissions: rolePermissions,
      },
      message: "Profile fetched successfully",
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  updateUserPermissions,
  getAllUsersByRole,
  login,
  getProfile,
};
