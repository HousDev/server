const express = require("express");
const router = express.Router();

const controller = require("../controllers/woPaymentHistoryController");
const upload = require("../middleware/upload");

// CREATE
router.post("/", upload.single("payment_proof"), controller.createPayment);

// READ ALL
router.get("/", controller.getAllPaymentsHistory);

// READ BY ID
router.get("/:id", controller.getPaymentById);

// UPDATE
router.put("/payment-status/:id", controller.updatePaymentStatus);
router.put("/:id", upload.single("payment_proof"), controller.updatePayment);

// DELETE
router.delete("/:id", controller.deletePayment);

module.exports = router;
