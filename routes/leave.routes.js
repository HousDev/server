const express = require("express");
const router = express.Router();
const LeaveController = require("../controllers/leave.controller");

// Middleware to handle JSON errors
const handleJsonErrors = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }
  next();
};

router.use(handleJsonErrors);

// Apply for leave with file upload
router.post("/apply", 
  LeaveController.upload, 
  LeaveController.applyLeave
);

// Get all leaves
router.get("/", LeaveController.getLeaves);

// Get leave statistics
router.get("/stats", LeaveController.getLeaveStats);

// Get single leave by ID
router.get("/:id", LeaveController.getLeaveById);

// Approve leave
router.post("/:id/approve", LeaveController.approveLeave);

// Reject leave
router.post("/:id/reject", LeaveController.rejectLeave);

// Download attachment
router.get("/:id/download", LeaveController.downloadAttachment);

// Delete leave
router.delete("/:id", LeaveController.deleteLeave);

module.exports = router;