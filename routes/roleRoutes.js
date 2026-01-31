// routes/roleRoutes.js
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const RoleController = require("../controllers/roleController");
const authMiddleware = require("../middleware/authMiddleware");

// Validation schemas
const createRoleValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Role name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Role name must be 2-100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("permissions")
    .optional()
    .isObject()
    .withMessage("Permissions must be an object"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean"),
];

const updateRoleValidation = [
  param("id").isInt().withMessage("Invalid role ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Role name must be 2-100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("permissions")
    .optional()
    .isObject()
    .withMessage("Permissions must be an object"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean"),
];

// All routes require authentication
router.use(authMiddleware);

// GET /api/roles - Get all roles
router.get("/", RoleController.getAllRoles);

// GET /api/roles/paginated - Get paginated roles
router.get(
  "/paginated",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("search").optional().trim(),
    query("is_active")
      .optional()
      .isIn(["true", "false", "1", "0"])
      .withMessage("Invalid is_active value"),
  ],
  RoleController.getRolesPaginated,
);

// GET /api/roles/stats - Get role statistics
router.get("/stats", RoleController.getRoleStats);

// GET /api/roles/permissions - Get all permissions
router.get("/permissions", RoleController.getAllPermissions);

// GET /api/roles/search - Search roles
router.get(
  "/search",
  [
    query("q")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
  ],
  RoleController.searchRoles,
);

// GET /api/roles/:id - Get role by ID
router.get(
  "/:id",
  [param("id").isInt().withMessage("Invalid role ID")],
  RoleController.getRoleById,
);

// GET /api/roles/name/:name - Get role by name
router.get(
  "/name/:name",
  [param("name").trim().notEmpty().withMessage("Role name is required")],
  RoleController.getRoleByName,
);

// POST /api/roles - Create new role
router.post("/", createRoleValidation, RoleController.createRole);

// PUT /api/roles/:id - Update role
router.put("/:id", updateRoleValidation, RoleController.updateRole);

router.put("/:roleId/permissions", RoleController.updateRolePermissions);

// PATCH /api/roles/:id/toggle - Toggle role active status
router.patch(
  "/:id/toggle",
  [param("id").isInt().withMessage("Invalid role ID")],
  RoleController.toggleRoleActive,
);

// DELETE /api/roles/:id - Delete role
router.delete(
  "/:id",
  [param("id").isInt().withMessage("Invalid role ID")],
  RoleController.deleteRole,
);

// ✅ FIXED: 404 handler for undefined routes - Method 1 (Recommended)
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

module.exports = router;
