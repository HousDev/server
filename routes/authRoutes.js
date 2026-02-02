// // routes/authRoutes.js
// const express = require("express");
// const { body } = require("express-validator");
// const authController = require("../controllers/authController");
// const authMiddleware = require("../middleware/authMiddleware");

// const router = express.Router();

// router.post(
//   "/login",
//   [
//     body("email").isEmail().withMessage("Valid email required"),
//     body("password").isLength({ min: 1 }).withMessage("Password required"),
//   ],
//   authController.login
// );

// // get current user
// router.get("/me", authMiddleware, authController.me);

// module.exports = router;




// routes/authRoutes.js
const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/login",
  [
    // Accept either 'identifier' or 'email' field for backward compatibility
    body("password").isLength({ min: 1 }).withMessage("Password required"),
  ],
  authController.login
);

// get current user
router.get("/me", authMiddleware, authController.me);

module.exports = router;