const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const DesignationController = require("../controllers/designationController");
const Role = require("../models/roleModel");
const { query: dbQuery } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// UUID validator
const validateUUID = param("id")
  .isString()
  .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .withMessage("Invalid UUID format");

// Validation schemas
const createDesignationValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Designation name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Designation name must be 2-100 characters"),
  body("department_id")
    .isUUID()
    .withMessage("Valid department ID required"),
  body("role_id")
    .isInt()
    .withMessage("Valid role ID required"),
  body("hierarchy_level")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Hierarchy level must be 0-10"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
];

const updateDesignationValidation = [
  validateUUID,
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Designation name must be 2-100 characters"),
  body("hierarchy_level")
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage("Hierarchy level must be 0-10"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
];

// Apply auth middleware
router.use(authMiddleware);

// Test endpoint - Raw database query
router.get("/test/all", async (req, res) => {
  try {
    const rows = await dbQuery("SELECT * FROM designations");
    
    res.json({
      success: true,
      total_count: rows.length,
      data: rows,
      message: "All designations (raw database query)"
    });
  } catch (error) {
    console.error("Error fetching all designations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all designations",
      message: error.message
    });
  }
});

// Test endpoint - With joins
router.get("/test/with-joins", async (req, res) => {
  try {
    const rows = await dbQuery(`
      SELECT ds.*,
             d.name as department_name,
             d.code as department_code,
             r.name as role_name
      FROM designations ds
      LEFT JOIN departments d ON ds.department_id = d.id
      LEFT JOIN roles r ON ds.role_id = r.id
      ORDER BY ds.is_active DESC
    `);
    
    res.json({
      success: true,
      total_count: rows.length,
      active_count: rows.filter(r => r.is_active).length,
      inactive_count: rows.filter(r => !r.is_active).length,
      data: rows,
      message: "Designations with joins"
    });
  } catch (error) {
    console.error("Error fetching designations with joins:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch designations",
      message: error.message
    });
  }
});

// Get all designations
router.get("/", DesignationController.getAllDesignations);

// Get designation statistics
router.get("/stats", DesignationController.getDesignationStats);

// Search designations
router.get(
  "/search",
  [
    query("query")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters")
  ],
  DesignationController.searchDesignations
);

// Get available departments for designation
router.get("/available-departments", DesignationController.getAvailableDepartments);

// Get available roles (all active roles)
router.get("/available-roles", async (req, res) => {
  try {
    let roles;
    if (Role.findAllActive) {
      roles = await Role.findAllActive();
    } else {
      const rows = await dbQuery(`
        SELECT * FROM roles 
        WHERE is_active = TRUE 
        ORDER BY name
      `);
      roles = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    }
    
    res.json({
      success: true,
      data: Array.isArray(roles) ? roles : [],
      message: "Roles fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching available roles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch roles",
      message: error.message
    });
  }
});

// Get roles by department for designation
router.get("/department/:departmentId/roles", DesignationController.getRolesForDepartment);

// Get designations by department and role
router.get("/department/:departmentId/role/:roleId", DesignationController.getDesignationsByDeptRole);

// Get designations by department
router.get("/department/:departmentId", DesignationController.getDesignationsByDepartment);

// Get designations by role
router.get("/role/:roleId", DesignationController.getDesignationsByRole);

// Get designation by ID
router.get("/:id", [validateUUID], DesignationController.getDesignationById);

// Create designation
router.post("/", createDesignationValidation, DesignationController.createDesignation);

// Update designation
router.put("/:id", updateDesignationValidation, DesignationController.updateDesignation);

// Delete designation
router.delete("/:id", [validateUUID], DesignationController.deleteDesignation);

// Toggle designation active status
router.patch("/:id/toggle", [validateUUID], DesignationController.toggleDesignationActive);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Designation API endpoint not found"
  });
});

module.exports = router;