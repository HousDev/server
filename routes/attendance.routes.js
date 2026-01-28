const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const ctrl = require("../controllers/attendance.controller");

router.post("/punch-in", upload.single("selfie"), ctrl.punchIn);
router.post("/punch-out", upload.single("selfie"), ctrl.punchOut);

router.get("/status/:userId", ctrl.getStatus);
router.get("/history/:userId", ctrl.getHistory);

module.exports = router;
