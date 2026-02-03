// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // your existing multer upload middleware

// ─── ADMIN-ONLY MIDDLEWARE ────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  const role = (req.user.role || "").toLowerCase();
  if (role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// ════════════════════════════════════════════════════════════════════════════
// PROFILE ROUTES
// ════════════════════════════════════════════════════════════════════════════
router.get   ("/profile",        authMiddleware, settingsController.getProfile);
router.put   ("/profile",        authMiddleware, settingsController.updateProfile);
router.post  ("/profile/avatar", authMiddleware, upload.single("avatar"), settingsController.uploadAvatar);
router.delete("/profile/avatar", authMiddleware, settingsController.removeAvatar);

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ROUTES
// ════════════════════════════════════════════════════════════════════════════
router.get ("/notifications", authMiddleware, settingsController.getNotificationPrefs);
router.put ("/notifications", authMiddleware, settingsController.updateNotificationPrefs);

// ════════════════════════════════════════════════════════════════════════════
// PASSWORD ROUTE
// ════════════════════════════════════════════════════════════════════════════
router.post("/password/change", authMiddleware, settingsController.changePassword);

// ════════════════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS ROUTES  (admin only)
// ════════════════════════════════════════════════════════════════════════════
router.get   ("/system",         authMiddleware, adminOnly, settingsController.getSystemSettings);
router.put   ("/system",         authMiddleware, adminOnly, settingsController.updateSystemSettings);

router.post  ("/system/logo",    authMiddleware, adminOnly, upload.single("logo"),    settingsController.uploadLogo);
router.delete("/system/logo",    authMiddleware, adminOnly, settingsController.removeLogo);

router.post  ("/system/favicon", authMiddleware, adminOnly, upload.single("favicon"), settingsController.uploadFavicon);
router.delete("/system/favicon", authMiddleware, adminOnly, settingsController.removeFavicon);

module.exports = router;    