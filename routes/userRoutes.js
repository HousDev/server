// // routes/userRoutes.js
// const express = require("express");
// const { body, param } = require("express-validator");
// const userController = require("../controllers/userController");

// const router = express.Router();

// // GET /api/users
// router.get("/", userController.getAllUsers);

// router.get("/role/:role", userController.getAllUsersByRole);

// // GET /api/users/:id
// router.get(
//   "/:id",
//   [param("id").isString().notEmpty()],
//   userController.getUserById,
// );

// // POST /api/users
// router.post(
//   "/",
//   [
//     body("email").isEmail().withMessage("Valid email required"),
//     body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
//     body("role").optional().isString(),
//     body("permissions").optional().isObject(),
//   ],
//   userController.createUser,
// );

// // PUT /api/users/:id
// router.put(
//   "/:id",
//   [
//     param("id").isString().notEmpty(),
//     body("email").optional().isEmail(),
//     body("password").optional().isLength({ min: 6 }),
//     body("permissions").optional().isObject(),
//   ],
//   userController.updateUser,
// );

// // DELETE /api/users/:id
// router.delete(
//   "/:id",
//   [param("id").isString().notEmpty()],
//   userController.deleteUser,
// );

// // PATCH /api/users/:id/toggle-active
// router.patch(
//   "/:id/toggle-active",
//   [param("id").isString().notEmpty()],
//   userController.toggleActive,
// );
// router.put("/:userId/permissions", userController.updateUserPermissions);

// module.exports = router;


// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const upload = require("../middleware/upload");

const router = express.Router();

// GET /api/users
router.get("/", userController.getAllUsers);

// GET /api/users/role/:role
router.get("/role/:role", userController.getAllUsersByRole);

// GET /api/users/:id
router.get("/:id", userController.getUserById);

// POST /api/users
router.post("/", userController.createUser);

// PUT /api/users/:id
router.put("/:id", userController.updateUser);

// DELETE /api/users/:id
router.delete("/:id", userController.deleteUser);

// PATCH /api/users/:id/profile-picture
router.patch(
  "/:id/profile-picture",
  upload.single("profile_picture"),
  userController.uploadProfilePicture
);

// PATCH /api/users/:id/toggle-active
router.patch("/:id/toggle-active", userController.toggleActive);

// PUT /api/users/:userId/permissions
router.put("/:userId/permissions", userController.updateUserPermissions);

module.exports = router;