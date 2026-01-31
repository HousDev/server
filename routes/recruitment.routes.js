// routes/recruitment.routes.js
const express = require("express");
const router = express.Router();
const RecruitmentController = require("../controllers/recruitment.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Apply auth middleware to all routes except public ones
router.use((req, res, next) => {
  if (req.path.startsWith('/public/')) {
    return next();
  }
  authMiddleware(req, res, next);
});

// JOBS
router.post("/jobs", RecruitmentController.createJob);
router.get("/jobs", RecruitmentController.getJobs);
router.get("/jobs/:id", RecruitmentController.getJobById);
router.patch("/jobs/:id/status", RecruitmentController.updateJobStatus);

// APPLICATIONS
router.get("/jobs/:jobId/applications", RecruitmentController.getJobApplications);
router.post(
  "/applications",
  RecruitmentController.uploadFile,
  RecruitmentController.createApplication
);
router.patch("/applications/:id/stage", RecruitmentController.updateApplicationStage);
router.post("/applications/:id/offer", RecruitmentController.sendOffer);

// REFERRALS
router.post(
  "/referrals",
  RecruitmentController.uploadFile,
  RecruitmentController.createReferral
);
router.get("/jobs/:jobId/referrals", RecruitmentController.getJobReferrals);

// SHARE LINKS
router.get("/jobs/:jobId/share-link", RecruitmentController.generateShareLink);

// PUBLIC ROUTES
router.get("/public/jobs/:hash", RecruitmentController.getJobByShareLink);
router.post(
  "/public/applications",
  RecruitmentController.uploadFile,
  RecruitmentController.createApplication
);

// STATISTICS
router.get("/stats", RecruitmentController.getStats);

module.exports = router;