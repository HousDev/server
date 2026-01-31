// // routes/departmentRoutes.js
// const express = require("express");
// const router = express.Router();
// const { body, param, query } = require("express-validator");
// const DepartmentController = require("../controllers/departmentController");
// const authMiddleware = require("../middleware/authMiddleware");

// // Custom UUID validator
// const validateUUID = param("id")
//   .isString()
//   .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
//   .withMessage("Invalid UUID format");

// // Validation schemas
// const createDepartmentValidation = [
//   body("name")
//     .trim()
//     .notEmpty()
//     .withMessage("Department name is required")
//     .isLength({ min: 2, max: 100 })
//     .withMessage("Department name must be 2-100 characters"),
//   body("code")
//     .trim()
//     .notEmpty()
//     .withMessage("Department code is required")
//     .isLength({ min: 2, max: 20 })
//     .withMessage("Department code must be 2-20 characters")
//     .matches(/^[A-Z0-9]+$/)
//     .withMessage(
//       "Department code must contain only uppercase letters and numbers",
//     ),
//   body("description")
//     .optional()
//     .trim()
//     .isLength({ max: 500 })
//     .withMessage("Description cannot exceed 500 characters"),
//   body("manager_id")
//     .optional()
//     .isString()
//     .withMessage("Manager ID must be a string"),
//   body("is_active")
//     .optional()
//     .isBoolean()
//     .withMessage("is_active must be boolean"),
// ];

// const updateDepartmentValidation = [
//   validateUUID,
//   body("name")
//     .optional()
//     .trim()
//     .isLength({ min: 2, max: 100 })
//     .withMessage("Department name must be 2-100 characters"),
//   body("code")
//     .optional()
//     .trim()
//     .isLength({ min: 2, max: 20 })
//     .withMessage("Department code must be 2-20 characters")
//     .matches(/^[A-Z0-9]+$/)
//     .withMessage(
//       "Department code must contain only uppercase letters and numbers",
//     ),
//   body("description")
//     .optional()
//     .trim()
//     .isLength({ max: 500 })
//     .withMessage("Description cannot exceed 500 characters"),
//   body("is_active")
//     .optional()
//     .isBoolean()
//     .withMessage("is_active must be boolean"),
// ];

// // All routes require authentication
// router.use(authMiddleware);

// // GET /api/departments - Get all departments
// router.get("/", DepartmentController.getAllDepartments);

// // GET /api/departments/search - Search departments
// router.get(
//   "/search",
//   [
//     query("query")
//       .trim()
//       .isLength({ min: 2 })
//       .withMessage("Search query must be at least 2 characters"),
//   ],
//   DepartmentController.searchDepartments,
// );

// // GET /api/departments/managers - Get active managers
// router.get("/managers", DepartmentController.getActiveManagers);

// // GET /api/departments/stats - Get department statistics
// router.get("/stats", DepartmentController.getDepartmentStats);

// // GET /api/departments/:id - Get department by ID
// router.get("/:id", [validateUUID], DepartmentController.getDepartmentById);

// // POST /api/departments - Create new department
// router.post(
//   "/",
//   createDepartmentValidation,
//   DepartmentController.createDepartment,
// );

// // PUT /api/departments/:id - Update department
// router.put(
//   "/:id",
//   updateDepartmentValidation,
//   DepartmentController.updateDepartment,
// );

// // PATCH /api/departments/:id/toggle - Toggle department active status
// router.patch(
//   "/:id/toggle",
//   [validateUUID],
//   DepartmentController.toggleDepartmentActive,
// );

// // DELETE /api/departments/:id - Delete department
// router.delete("/:id", [validateUUID], DepartmentController.deleteDepartment);

// // 404 handler for undefined routes
// router.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "API endpoint not found",
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const DepartmentController = require("../controllers/departmentController");
const authMiddleware = require("../middleware/authMiddleware");

// Custom UUID validator
const validateUUID = param("id")
  .isString()
  .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .withMessage("Invalid UUID format");

// Create department validation with role_ids
const createDepartmentValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be 2-100 characters"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must be 2-20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Department code must contain only uppercase letters and numbers"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("manager_id")
    .optional()
    .isString()
    .withMessage("Manager ID must be a string"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean"),
  body("role_ids")
    .optional()
    .isArray()
    .withMessage("role_ids must be an array"),
  body("role_ids.*")
    .optional()
    .isInt()
    .withMessage("Each role ID must be an integer")
];

// Update department validation
const updateDepartmentValidation = [
  validateUUID,
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be 2-100 characters"),
  body("code")
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must be 2-20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Department code must contain only uppercase letters and numbers"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("manager_id")
    .optional()
    .isString()
    .withMessage("Manager ID must be a string"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean"),
  body("role_ids")
    .optional()
    .isArray()
    .withMessage("role_ids must be an array"),
  body("role_ids.*")
    .optional()
    .isInt()
    .withMessage("Each role ID must be an integer")
];

// All routes require authentication
router.use(authMiddleware);

// ✅ CRITICAL: SPECIFIC ROUTES MUST COME BEFORE DYNAMIC :id ROUTES

// GET /api/departments/available-roles
router.get("/available-roles", DepartmentController.getAvailableRoles);

// GET /api/departments/search
router.get(
  "/search",
  [
    query("query")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters"),
  ],
  DepartmentController.searchDepartments,
);

// GET /api/departments/managers
router.get("/managers", DepartmentController.getActiveManagers);

// GET /api/departments/stats
router.get("/stats", DepartmentController.getDepartmentStats);

// GET /api/departments - Get all departments WITH roles
router.get("/", DepartmentController.getAllDepartments);

// POST /api/departments - Create new department WITH roles
router.post(
  "/",
  createDepartmentValidation,
  DepartmentController.createDepartment
);

// ✅ CRITICAL: PATCH /toggle MUST come BEFORE GET /:id
// PATCH /api/departments/:id/toggle - Toggle department active status
router.patch(
  "/:id/toggle",
  [validateUUID],
  DepartmentController.toggleDepartmentActive,
);

// GET /api/departments/:id/roles - Get roles by department
router.get("/:id/roles", [validateUUID], DepartmentController.getRolesByDepartment);

// GET /api/departments/:id - Get department by ID WITH roles
router.get("/:id", [validateUUID], DepartmentController.getDepartmentById);

// PUT /api/departments/:id - Update department WITH roles
router.put(
  "/:id",
  updateDepartmentValidation,
  DepartmentController.updateDepartment
);

// DELETE /api/departments/:id - Delete department
router.delete("/:id", [validateUUID], DepartmentController.deleteDepartment);

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

module.exports = router;