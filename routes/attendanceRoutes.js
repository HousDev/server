const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const upload = require("../middleware/upload");

router.post("/punch-in", upload.single("selfie"), attendanceController.punchIn);
router.post(
  "/punch-out",
  upload.single("selfie"),
  attendanceController.punchOut,
);

router.get("/today/:user_id", attendanceController.getTodayStatus);
router.get("/todayLast/:user_id", attendanceController.getLastAttendanceOfUser);
router.get("/today", attendanceController.getTodayAll);
router.get("/history/:user_id", attendanceController.getHistory);
router.get("/statistics", attendanceController.getStatistics);
router.get("/check/:user_id", attendanceController.checkAttendance);

module.exports = router;
