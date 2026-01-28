const express = require("express");
const router = express.Router();
const ExpenseController = require("../controllers/expense.controller");

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

// Submit expense claim with file upload
router.post("/submit", 
    ExpenseController.upload, 
    ExpenseController.submitExpense
);

// Get all expenses
router.get("/", ExpenseController.getExpenses);

// Get expense statistics
router.get("/stats", ExpenseController.getExpenseStats);

// Get categories
router.get("/categories", ExpenseController.getCategories);

// Get single expense by ID
router.get("/:id", ExpenseController.getExpenseById);

// Approve expense
router.post("/:id/approve", ExpenseController.approveExpense);

// Reject expense
router.post("/:id/reject", ExpenseController.rejectExpense);

// Download receipt
router.get("/:id/download", ExpenseController.downloadReceipt);

// Delete expense
router.delete("/:id", ExpenseController.deleteExpense);

module.exports = router;