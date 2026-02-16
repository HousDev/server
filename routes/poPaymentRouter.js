const express = require("express");
const poPaymentRouter = express.Router();
const poPaymentController = require("../controllers/poPaymentController");
const upload = require("../middleware/upload"); // your existing multer setup

// ---------------------------
// Routes
// ---------------------------

// Create PO payment (USER + ADMIN)
poPaymentRouter.post(
  "/",
  upload.single("payment_proof"), // handle file upload
  (req, res, next) => {
    if (req.file) {
      req.body.payment_proof = req.file.filename; // save file name for DB
    }
    next();
  },
  poPaymentController.createPayment,
);

// Get all payments (ADMIN only)
poPaymentRouter.get("/", poPaymentController.getPayments);

poPaymentRouter.get("/history", poPaymentController.getPaymentsHistory);

// Update payment (ADMIN only)
poPaymentRouter.put(
  "/:id",
  upload.single("payment_proof"), // optional new file
  (req, res, next) => {
    if (req.file) {
      req.body.payment_proof = req.file.filename; // replace old file path
    }
    next();
  },
  poPaymentController.updatePayment,
);

// Delete payment (ADMIN only)
poPaymentRouter.delete("/:id", poPaymentController.deletePayment);

module.exports = poPaymentRouter;
