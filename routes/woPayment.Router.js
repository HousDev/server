const express = require("express");
const woPaymentRouter = express.Router();
const woPaymentController = require("../controllers/woPaymentController");
const upload = require("../middleware/upload"); // existing multer setup

// ---------------------------
// Routes
// ---------------------------

// Create WO payment (USER + ADMIN)
woPaymentRouter.post(
  "/",
  upload.single("payment_proof"), // handle file upload
  (req, res, next) => {
    if (req.file) {
      req.body.payment_proof = req.file.filename; // save file name in DB
    }
    next();
  },
  woPaymentController.createWoPayment,
);

// Get all WO payments (ADMIN only)
woPaymentRouter.get("/", woPaymentController.getWoPayments);

// Get WO payment history (ADMIN only)
woPaymentRouter.get(
  "/history",
  woPaymentController.getWoPaymentsHistory
);

// Update WO payment (ADMIN only)
woPaymentRouter.put(
  "/:id",
  upload.single("payment_proof"), // optional new file
  (req, res, next) => {
    if (req.file) {
      req.body.payment_proof = req.file.filename; // replace old file path
    }
    next();
  },
  woPaymentController.updateWoPayment,
);

// Delete WO payment (ADMIN only)
woPaymentRouter.delete("/:id", woPaymentController.deleteWoPayment);

module.exports = woPaymentRouter;