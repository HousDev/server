
// const bcrypt = require("bcryptjs");
// const { validationResult } = require("express-validator");
// const UserModel = require("../models/userModel");
// const Role = require("../models/roleModel"); // Changed from RoleModel to Role
// const fs = require("fs"); // Add this for file handling

// // ✅ Password और sensitive data remove करें
// const scrub = (user) => {
//   if (!user) return null;
//   const copy = { ...user };
//   delete copy.password;
//   delete copy.passwordHash;
//   return copy;
// };

// // ✅ सभी users get करें
// async function getAllUsers(req, res) {
//   try {
//     const users = await UserModel.findAll();
//     res.json({
//       success: true,
//       data: users.map(scrub),
//       message: "Users fetched successfully",
//       count: users.length,
//     });
//   } catch (err) {
//     console.error("getAllUsers error:", err);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch users",
//       message: err.message,
//     });
//   }
// }

// async function getAllUsersByRole(req, res) {
//   try {
//     const role = req.params.role;
//     const users = await UserModel.findAllByRole(role);
//     res.json(users.map(scrub));
//   } catch (err) {
//     console.error("getAllUsers error:", err);
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// }

// // ✅ ID से user get करें
// async function getUserById(req, res) {
//   try {
//     const user = await UserModel.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }

//     // Get role permissions - FIXED: Changed from RoleModel.getRoleByName to Role.findByName
//     let rolePermissions = {};
//     try {
//       const role = await Role.findByName(user.role); // FIXED HERE
//       if (role) {
//         rolePermissions = role.permissions || {};
//       }
//     } catch (roleError) {
//       console.warn("Could not fetch role permissions:", roleError.message);
//     }

//     res.json({
//       success: true,
//       data: {
//         ...scrub(user),
//         permissions: rolePermissions,
//       },
//       message: "User fetched successfully",
//     });
//   } catch (err) {
//     console.error("getUserById error:", err);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch user",
//       message: err.message,
//     });
//   }
// }

// // ✅ नया user create करें (FIXED)
// async function createUser(req, res) {
//   try {
//     // Validation check
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const {
//       email,
//       full_name,
//       phone,
//       role = "USER",
//       department,
//       password,
//       profile_picture = null,
//       is_active = true,
//       permissions = {},
//     } = req.body;

//     console.log("Create user request body:", req.body);

//     // Validate required fields
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         error: "Email and password are required",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         error: "Password must be at least 6 characters",
//       });
//     }

//     // Check if user already exists
//     const existing = await UserModel.findByEmailWithPassword(email);
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         error: "A user with this email already exists",
//       });
//     }

//     // Hash password
//     const hash = await bcrypt.hash(password, 10);

//     // Create user with safe values
//     const created = await UserModel.create({
//       email: email.trim(),
//       full_name: full_name || null,
//       phone: phone || null,
//       role: role.toUpperCase(),
//       department: department || null,
//       profile_picture: profile_picture || null,
//       password: hash,
//       is_active: is_active !== false,
//       permissions: permissions || {},
//     });

//     console.log("User created successfully:", created);

//     // Check if role exists, if not create it - FIXED: Changed from RoleModel.getRoleByName to Role.findByName
//     try {
//       const existingRole = await Role.findByName(role); // FIXED HERE
//       if (!existingRole) {
//         // Create default permissions for new role - FIXED: Changed from RoleModel.createRole to Role.create
//         const defaultPermissions = {
//           view_dashboard: true,
//           view_service_orders: true,
//         };
//         await Role.create({ // FIXED HERE
//           name: role,
//           description: `Auto-created role for ${role}`,
//           permissions: defaultPermissions,
//           is_active: true,
//           created_by: "system",
//         });
//         console.log("Auto-created role:", role);
//       }
//     } catch (roleError) {
//       console.warn("Could not check/create role:", roleError.message);
//     }

//     res.status(201).json({
//       success: true,
//       data: scrub(created),
//       message: "User created successfully",
//     });
//   } catch (err) {
//     console.error("createUser error:", err);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create user",
//       message: err.message,
//       details: err.stack,
//     });
//   }
// }

// // ✅ User update करें (FIXED)
// // async function updateUser(req, res) {
// //   try {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //       return res.status(400).json({
// //         success: false,
// //         errors: errors.array(),
// //       });
// //     }

// //     const { id } = req.params;
// //     const existing = await UserModel.findById(id);
// //     if (!existing) {
// //       return res.status(404).json({
// //         success: false,
// //         error: "User not found",
// //       });
// //     }

// //     const {
// //       full_name,
// //       phone,
// //       role,
// //       department,
// //       password,
// //       profile_picture,
// //       is_active,
// //       permissions,
// //     } = req.body;

// //     console.log("Update user request:", { id, body: req.body });

// //     // Prepare update data with safe values
// //     const updateData = {};

// //     if (full_name !== undefined) updateData.full_name = full_name || null;
// //     if (phone !== undefined) updateData.phone = phone || null;
// //     if (role !== undefined) updateData.role = role.toUpperCase();
// //     if (department !== undefined) updateData.department = department || null;
// //     if (profile_picture !== undefined) updateData.profile_picture = profile_picture || null;
// //     if (is_active !== undefined) updateData.is_active = is_active;
// //     if (permissions !== undefined) updateData.permissions = permissions || {};

// //     // Hash new password if provided
// //     if (password) {
// //       if (password.length < 6) {
// //         return res.status(400).json({
// //           success: false,
// //           error: "Password must be at least 6 characters",
// //         });
// //       }
// //       updateData.password = await bcrypt.hash(password, 10);
// //     }

// //     // Update user
// //     const updated = await UserModel.update(id, updateData);

// //     res.json({
// //       success: true,
// //       data: scrub(updated),
// //       message: "User updated successfully",
// //     });
// //   } catch (err) {
// //     console.error("updateUser error:", err);
// //     res.status(500).json({
// //       success: false,
// //       error: "Failed to update user",
// //       message: err.message,
// //     });
// //   }
// // }

// // ✅ User update करें - SYNC WITH EMPLOYEE
// async function updateUser(req, res) {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array(),
//       });
//     }

//     const { id } = req.params;
//     const existing = await UserModel.findById(id);
//     if (!existing) {
//       return res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }

//     const {
//       full_name,
//       phone,
//       role,
//       department,
//       password,
//       profile_picture,
//       is_active,
//       permissions,
//     } = req.body;

//     console.log("Update user request:", { id, body: req.body });

//     // Prepare update data with safe values
//     const updateData = {};

//     if (full_name !== undefined) updateData.full_name = full_name || null;
//     if (phone !== undefined) updateData.phone = phone || null;
//     if (role !== undefined) updateData.role = role.toUpperCase();
//     if (department !== undefined) updateData.department = department || null;
//     if (profile_picture !== undefined) updateData.profile_picture = profile_picture || null;
//     if (is_active !== undefined) updateData.is_active = is_active;
//     if (permissions !== undefined) updateData.permissions = permissions || {};

//     // Hash new password if provided
//     if (password) {
//       if (password.length < 6) {
//         return res.status(400).json({
//           success: false,
//           error: "Password must be at least 6 characters",
//         });
//       }
//       updateData.password = await bcrypt.hash(password, 10);
//     }

//     if (user.profile_picture) {
//   // Sync to employee
//   try {
//     const { query } = require("../config/db");
//     await query(
//       `UPDATE hrms_employees SET profile_picture = ? WHERE email = ?`,
//       [profilePictureUrl, user.email]
//     );
//     console.log(`Profile picture synced to employee for user: ${user.email}`);
//   } catch (syncError) {
//     console.warn("Could not sync profile picture to employee:", syncError.message);
//   }
// }
//     // Update user
//     const updated = await UserModel.update(id, updateData);

//     // ✅ SYNC TO EMPLOYEE TABLE
//     try {
//       const { query } = require("../config/db");
      
//       // Check if employee exists for this user
//       const employeeRows = await query(
//         `SELECT id FROM hrms_employees WHERE email = ? LIMIT 1`,
//         [existing.email]
//       );
      
//       if (employeeRows && employeeRows.length > 0) {
//         const employeeId = employeeRows[0].id;
        
//         // Parse full name into first, middle, last
//         const nameParts = (full_name || existing.full_name || '').trim().split(' ');
//         const firstName = nameParts[0] || '';
//         const lastName = nameParts[nameParts.length - 1] || '';
//         const middleName = nameParts.slice(1, -1).join(' ') || '';
        
//         // Prepare employee update data
//         const employeeUpdateData = {};
        
//         if (full_name !== undefined) {
//           employeeUpdateData.first_name = firstName;
//           employeeUpdateData.last_name = lastName || firstName;
//           employeeUpdateData.middle_name = middleName;
//         }
        
//         if (phone !== undefined) employeeUpdateData.phone = phone;
//          if (profile_picture !== undefined) employeeUpdateData.profile_picture = profile_picture;
//     if (is_active !== undefined) {
//       employeeUpdateData.employee_status = is_active ? 'active' : 'inactive';
//     }
//           if (role !== undefined) {
//       // Get role_id from roles table
//       const roleRows = await query(
//         `SELECT id FROM roles WHERE name = ? LIMIT 1`,
//         [role.toUpperCase()]
//       );
//       if (roleRows && roleRows.length > 0) {
//         employeeUpdateData.role_id = roleRows[0].id;
//       }
//     }
//         // Build dynamic update query
//         const fields = [];
//         const values = [];
        
//         Object.entries(employeeUpdateData).forEach(([key, value]) => {
//           fields.push(`${key} = ?`);
//           values.push(value);
//         });
        
//         if (fields.length > 0) {
//           values.push(employeeId);
//           await query(
//             `UPDATE hrms_employees SET ${fields.join(', ')} WHERE id = ?`,
//             values
//           );
//           console.log(`Employee ${employeeId} synced successfully`);
//         }
//       }
//     } catch (syncError) {
//       console.warn("Could not sync to employee:", syncError.message);
//       // Continue even if sync fails
//     }

//     res.json({
//       success: true,
//       data: scrub(updated),
//       message: "User updated successfully",
//     });
//   } catch (err) {
//     console.error("updateUser error:", err);
//     res.status(500).json({
//       success: false,
//       error: "Failed to update user",
//       message: err.message,
//     });
//   }
// }

// // ✅ Profile picture upload करें
// // ✅ Profile picture upload करें - FIXED VERSION
// async function uploadProfilePicture(req, res) {
//   try {
//     const { id } = req.params;
    
//     console.log("Upload profile picture request for user:", id);
//     console.log("File received:", req.file);
    
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         error: "No file uploaded",
//       });
//     }

//     const user = await UserModel.findById(id);
//     if (!user) {
//       // Delete the uploaded file since user doesn't exist
//       if (req.file.path) {
//         try {
//           fs.unlinkSync(req.file.path);
//         } catch (cleanupErr) {
//           console.error("Failed to cleanup file:", cleanupErr);
//         }
//       }
//       return res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }

//     // ✅ FIX: Consistent URL format - always use `/uploads/filename`
//     const profilePictureUrl = `/uploads/${req.file.filename}`;
//     console.log("Profile picture URL:", profilePictureUrl);

//     // Update user profile picture
//     const updated = await UserModel.update(id, { profile_picture: profilePictureUrl });

//     res.json({
//       success: true,
//       data: scrub(updated),
//       message: "Profile picture uploaded successfully",
//     });
//   } catch (err) {
//     console.error("uploadProfilePicture error:", err);
    
//     // Clean up file if there was an error
//     if (req.file && req.file.path) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (cleanupErr) {
//         console.error("Failed to cleanup file:", cleanupErr);
//       }
//     }
    
//     res.status(500).json({
//       success: false,
//       error: "Failed to upload profile picture",
//       message: err.message,
//     });
//   }
// }

// // ✅ User delete करें
// // async function deleteUser(req, res) {
// //   try {
// //     const { id } = req.params;
// //     const existing = await UserModel.findById(id);
// //     if (!existing) {
// //       return res.status(404).json({
// //         success: false,
// //         error: "User not found",
// //       });
// //     }

// //     // Prevent self-deletion (optional)
// //     if (req.user && req.user.userId === id) {
// //       return res.status(400).json({
// //         success: false,
// //         error: "You cannot delete your own account",
// //       });
// //     }

// //     await UserModel.remove(id);

// //     res.json({
// //       success: true,
// //       message: "User deleted successfully",
// //     });
// //   } catch (err) {
// //     console.error("deleteUser error:", err);
// //     res.status(500).json({
// //       success: false,
// //       error: "Failed to delete user",
// //       message: err.message,
// //     });
// //   }
// // }


// // ✅ User delete करें - ALSO DELETE EMPLOYEE
// async function deleteUser(req, res) {
//   try {
//     const { id } = req.params;
//     const existing = await UserModel.findById(id);
//     if (!existing) {
//       return res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }

//     // Prevent self-deletion (optional)
//     if (req.user && req.user.userId === id) {
//       return res.status(400).json({
//         success: false,
//         error: "You cannot delete your own account",
//       });
//     }

//     // ✅ DELETE EMPLOYEE RECORD IF EXISTS
//     try {
//       const { query } = require("../config/db");
//       await query(
//         `DELETE FROM hrms_employees WHERE email = ?`,
//         [existing.email]
//       );
//       console.log(`Employee record deleted for user: ${existing.email}`);
//     } catch (empError) {
//       console.warn("Could not delete employee record:", empError.message);
//       // Continue with user deletion even if employee deletion fails
//     }

//     // Delete user
//     await UserModel.remove(id);

//     res.json({
//       success: true,
//       message: "User deleted successfully",
//     });
//   } catch (err) {
//     console.error("deleteUser error:", err);
//     res.status(500).json({
//       success: false,
//       error: "Failed to delete user",
//       message: err.message,
//     });
//   }
// }
// // ✅ Active status toggle करें
// // async function toggleActive(req, res) {
// //   try {
// //     const { id } = req.params;
// //     const user = await UserModel.toggleActive(id);
// //     if (!user) {
// //       return res.status(404).json({
// //         success: false,
// //         error: "User not found",
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: scrub(user),
// //       message: `User ${user.is_active ? "activated" : "deactivated"} successfully`,
// //     });
// //   } catch (err) {
// //     console.error("toggleActive error:", err);
// //     res.status(500).json({
// //       success: false,
// //       error: "Failed to toggle active status",
// //       message: err.message,
// //     });
// //   }
// // }
// // ✅ Active status toggle करें - UPDATED
// // ✅ Active status toggle करें - UPDATED
// async function toggleActive(req, res) {
//   try {
//     const { id } = req.params;
//     const user = await UserModel.toggleActive(id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }

//     // ✅ Also update employee status if user is an employee
//     try {
//       const { query } = require("../config/db");
//       const newStatus = user.is_active ? 'active' : 'inactive';
//       await query(
//         `UPDATE hrms_employees SET employee_status = ? WHERE email = ?`,
//         [newStatus, user.email]
//       );
//       console.log(`Employee status synced to: ${newStatus}`);
//     } catch (empError) {
//       console.warn("Could not sync employee status:", empError.message);
//       // Continue even if employee sync fails
//     }

//     res.json({
//       success: true,
//       data: scrub(user),
//       message: `User ${user.is_active ? "activated" : "deactivated"} successfully`,
//     });
//   } catch (err) {
//     console.error("toggleActive error:", err);
//     res.status(500).json({
//       success: false,
//       error: "Failed to toggle active status",
//       message: err.message,
//     });
//   }
// }

// // ✅ User permissions update करें
// async function updateUserPermissions(req, res) {
//   try {
//     const { userId } = req.params;
//     const { permissions } = req.body;

//     if (!userId || permissions === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID and permissions are required",
//       });
//     }

//     const existing = await UserModel.findById(userId);
//     if (!existing) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Update user permissions
//     const user = await UserModel.updateUserPermissions(userId, permissions);

//     return res.status(200).json({
//       success: true,
//       message: "User permissions updated successfully",
//       data: scrub(user),
//     });
//   } catch (error) {
//     console.error("updateUserPermissions error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// }

// // ✅ Login function
// // ✅ Login function - UPDATED
// async function login(req, res) {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required",
//       });
//     }

//     // Find user with password
//     const user = await UserModel.findByEmailWithPassword(email);
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     // ✅ CHECK 1: Check if user account is active
//     if (!user.is_active) {
//       return res.status(403).json({
//         success: false,
//         message: "Your account has been deactivated. Please contact administrator.",
//       });
//     }

//     // Check password
//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     // ✅ CHECK 2: If user is an employee, check employee status too
//     try {
//       const { query } = require("../config/db");
//       const employeeRows = await query(
//         `SELECT employee_status FROM hrms_employees WHERE user_id = ? LIMIT 1`,
//         [user.id]
//       );
      
//       if (employeeRows && employeeRows.length > 0) {
//         const employee = employeeRows[0];
//         if (employee.employee_status !== 'active') {
//           return res.status(403).json({
//             success: false,
//             message: "Your employee account is not active. Please contact HR.",
//           });
//         }
//       }
//     } catch (empError) {
//       console.warn("Could not check employee status:", empError.message);
//       // Continue with login if employee check fails (user might not be an employee)
//     }

//     // Get role permissions
//     let rolePermissions = {};
//     try {
//       const role = await Role.findByName(user.role);
//       if (role) {
//         rolePermissions = role.permissions || {};
//       }
//     } catch (roleError) {
//       console.warn("Could not fetch role permissions:", roleError.message);
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         user: scrub(user),
//         permissions: rolePermissions,
//       },
//       message: "Login successful",
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Login failed",
//       error: error.message,
//     });
//   }
// }
// // ✅ Get user profile
// async function getProfile(req, res) {
//   try {
//     const userId = req.user?.userId;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const user = await UserModel.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Get role permissions - FIXED: Changed from RoleModel.getRoleByName to Role.findByName
//     let rolePermissions = {};
//     try {
//       const role = await Role.findByName(user.role); // FIXED HERE
//       if (role) {
//         rolePermissions = role.permissions || {};
//       }
//     } catch (roleError) {
//       console.warn("Could not fetch role permissions:", roleError.message);
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         ...scrub(user),
//         permissions: rolePermissions,
//       },
//       message: "Profile fetched successfully",
//     });
//   } catch (error) {
//     console.error("Get profile error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch profile",
//       error: error.message,
//     });
//   }
// }

// module.exports = {
//   getAllUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   deleteUser,
//   toggleActive,
//   updateUserPermissions,
//   getAllUsersByRole,
//   login,
//   getProfile,
//   uploadProfilePicture,
// };




/*------------31-1-26------------------------*/


const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const UserModel = require("../models/userModel");
const Role = require("../models/roleModel");
const fs = require("fs");

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
      const role = await Role.findByName(user.role);
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

// ✅ नया user create करें
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
      department_id,
      password,
      profile_picture = null,
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
      role: role.toLowerCase(),
      department: department || null,
      department_id: department_id || null,
      profile_picture: profile_picture || null,
      password: hash,
      is_active: is_active !== false,
      permissions: permissions || {},
    });

    console.log("User created successfully:", created);

    // Check if role exists, if not create it
    try {
      const existingRole = await Role.findByName(role);
      if (!existingRole) {
        // Create default permissions for new role
        const defaultPermissions = {
          view_dashboard: true,
          view_service_orders: true,
        };
        await Role.create({
          // FIXED HERE
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

// ✅ User update करें - SYNC WITH EMPLOYEE (FIXED VERSION)
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    
    console.log("Update user request received:", {
      id,
      body: req.body,
      params: req.params
    });
    
    const existing = await UserModel.findById(id);
    if (!existing) {
      console.log("User not found with ID:", id);
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
      department_id,
      password,
      profile_picture,
      is_active,
      permissions,
    } = req.body;

    console.log("Update data received:", {
      full_name,
      phone,
      role,
      department,
      department_id,
      password: password ? "***PROVIDED***" : "NOT PROVIDED",
      profile_picture,
      is_active,
      permissions,
    });

    // Prepare update data with safe values
    const updateData = {};

    if (full_name !== undefined) updateData.full_name = full_name || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role !== undefined) updateData.role = role.toLowerCase();
    if (department !== undefined) updateData.department = department || null;
    if (profile_picture !== undefined)
      updateData.profile_picture = profile_picture || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (permissions !== undefined) updateData.permissions = permissions || {};

    // Only include department_id if it's provided
    if (department_id !== undefined) {
      updateData.department_id = department_id || null;
    }

    // Hash new password if provided
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
      console.log("Password hashed for update");
    }

    console.log("Updating user with data:", updateData);

    // Update user
    const updated = await UserModel.update(id, updateData);
    
    if (!updated) {
      throw new Error("Failed to update user in database");
    }

    console.log("User updated successfully:", scrub(updated));

    // ✅ SYNC TO EMPLOYEE TABLE
    try {
      const { query } = require("../config/db");
      
      // Check if employee exists for this user
      const employeeRows = await query(
        `SELECT id, email FROM hrms_employees WHERE email = ? LIMIT 1`,
        [existing.email]
      );
      
      console.log("Employee check result:", employeeRows);
      
      if (employeeRows && employeeRows.length > 0) {
        const employeeId = employeeRows[0].id;
        const employeeEmail = employeeRows[0].email;
        
        // Parse full name into first, middle, last
        const fullName = updateData.full_name || existing.full_name || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || firstName;
        const middleName = nameParts.slice(1, -1).join(' ') || '';
        
        // Prepare employee update data
        const employeeUpdateData = {};
        
        if (full_name !== undefined) {
          employeeUpdateData.first_name = firstName;
          employeeUpdateData.last_name = lastName;
          if (middleName) employeeUpdateData.middle_name = middleName;
        }
        
        if (phone !== undefined) employeeUpdateData.phone = phone;
        if (profile_picture !== undefined) employeeUpdateData.profile_picture = profile_picture;
        if (is_active !== undefined) {
          employeeUpdateData.employee_status = is_active ? 'active' : 'inactive';
        }
        
        // Update role if changed
       if (role !== undefined) {
      const roleRows = await query(
        `SELECT id FROM roles WHERE name = ? LIMIT 1`,
        [role.toUpperCase()]
      );
      if (roleRows && roleRows.length > 0) {
        employeeUpdateData.role_id = roleRows[0].id;
        console.log("Found role ID:", roleRows[0].id, "for role:", role);
      }
    }
        
        // Update department if changed
          if (department_id !== undefined) {
      employeeUpdateData.department_id = department_id;
    } else if (department !== undefined) {
      // If only department name is provided, lookup department_id
      const deptRows = await query(
        `SELECT id FROM departments WHERE name = ? LIMIT 1`,
        [department]
      );
      if (deptRows && deptRows.length > 0) {
        employeeUpdateData.department_id = deptRows[0].id;
        console.log("Found department ID:", deptRows[0].id, "for department:", department);
      }
    }

        
        // Build dynamic update query
        const fields = [];
        const values = [];
        
        Object.entries(employeeUpdateData).forEach(([key, value]) => {
          fields.push(`${key} = ?`);
          values.push(value);
        });
        
        if (fields.length > 0) {
          values.push(employeeId);
          const updateQuery = `UPDATE hrms_employees SET ${fields.join(', ')} WHERE id = ?`;
          console.log("Executing employee sync query:", updateQuery, values);
          
          const result = await query(updateQuery, values);
          console.log(`Employee ${employeeId} synced successfully. Affected rows:`, result.affectedRows);
        } else {
          console.log("No employee fields to update");
        }
      } else {
        console.log("No employee found for user:", existing.email);
      }
    } catch (syncError) {
      console.warn("Could not sync to employee:", syncError.message);
      console.warn("Sync error stack:", syncError.stack);
      // Continue even if sync fails
    }

    res.json({
      success: true,
      data: scrub(updated),
      message: "User updated successfully",
    });
  } catch (err) {
    console.error("updateUser error:", err);
    console.error("Error stack:", err.stack);
    
    res.status(500).json({
      success: false,
      error: "Failed to update user",
      message: err.message || "Unknown error occurred",
    });
  }
}

// ✅ Profile picture upload करें - FIXED VERSION
async function uploadProfilePicture(req, res) {
  try {
    const { id } = req.params;

    console.log("Upload profile picture request for user:", id);
    console.log("File received:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      // Delete the uploaded file since user doesn't exist
      if (req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupErr) {
          console.error("Failed to cleanup file:", cleanupErr);
        }
      }
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // ✅ FIX: Consistent URL format - always use `/uploads/filename`
    const profilePictureUrl = `/uploads/${req.file.filename}`;
    console.log("Profile picture URL:", profilePictureUrl);

    // Update user profile picture
    const updated = await UserModel.update(id, {
      profile_picture: profilePictureUrl,
    });

    // ✅ SYNC TO EMPLOYEE
    try {
      const { query } = require("../config/db");
      await query(
        `UPDATE hrms_employees SET profile_picture = ? WHERE email = ?`,
        [profilePictureUrl, user.email]
      );
      console.log(`Profile picture synced to employee for user: ${user.email}`);
    } catch (syncError) {
      console.warn("Could not sync profile picture to employee:", syncError.message);
    }

    res.json({
      success: true,
      data: scrub(updated),
      message: "Profile picture uploaded successfully",
    });
  } catch (err) {
    console.error("uploadProfilePicture error:", err);

    // Clean up file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("Failed to cleanup file:", cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to upload profile picture",
      message: err.message,
    });
  }
}

// ✅ User delete करें - ALSO DELETE EMPLOYEE (FIXED)
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

    // ✅ DELETE EMPLOYEE RECORD IF EXISTS
    try {
      const { query } = require("../config/db");
      const result = await query(
        `DELETE FROM hrms_employees WHERE email = ?`,
        [existing.email]
      );
      console.log(`Employee record deleted for user: ${existing.email}. Affected rows:`, result.affectedRows);
    } catch (empError) {
      console.warn("Could not delete employee record:", empError.message);
      // Continue with user deletion even if employee deletion fails
    }

    // Delete user
    const deleted = await UserModel.remove(id);
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: "Failed to delete user",
      });
    }

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

// ✅ Active status toggle करें - UPDATED (FIXED)
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

    // ✅ Also update employee status if user is an employee
    try {
      const { query } = require("../config/db");
      const newStatus = user.is_active ? 'active' : 'inactive';
      const result = await query(
        `UPDATE hrms_employees SET employee_status = ? WHERE email = ?`,
        [newStatus, user.email]
      );
      console.log(`Employee status synced to: ${newStatus} for user ${user.email}. Affected rows:`, result.affectedRows);
    } catch (empError) {
      console.warn("Could not sync employee status:", empError.message);
      // Continue even if employee sync fails
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
async function updateUserPermissions(req, res) {
  try {
    const { userId } = req.params;
    const permissions = req.body;

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
}

// ✅ Login function - UPDATED
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

    // ✅ CHECK 1: Check if user account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact administrator.",
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

    // ✅ CHECK 2: If user is an employee, check employee status too
    try {
      const { query } = require("../config/db");
      const employeeRows = await query(
        `SELECT employee_status FROM hrms_employees WHERE user_id = ? OR email = ? LIMIT 1`,
        [user.id, user.email]
      );
      
      if (employeeRows && employeeRows.length > 0) {
        const employee = employeeRows[0];
        if (employee.employee_status !== 'active') {
          return res.status(403).json({
            success: false,
            message: "Your employee account is not active. Please contact HR.",
          });
        }
      }
    } catch (empError) {
      console.warn("Could not check employee status:", empError.message);
      // Continue with login if employee check fails (user might not be an employee)
    }

    // Get role permissions
    let rolePermissions = {};
    try {
      const role = await Role.findByName(user.role);
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
      const role = await Role.findByName(user.role);
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
  uploadProfilePicture,
};
