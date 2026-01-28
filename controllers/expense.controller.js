const ExpenseModel = require('../models/expense.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for receipt upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/expenses/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

class ExpenseController {
    // Upload middleware
    static upload = upload.single('receipt');

    // Submit expense claim
    static async submitExpense(req, res) {
        try {
            const {
                employee_id,
                category,
                expense_date,
                merchant_vendor_name,
                description,
                amount
            } = req.body;

            // Validate required fields
            if (!employee_id || !category || !expense_date || !merchant_vendor_name || !description || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Please fill all required fields'
                });
            }

            // Validate amount
            if (parseFloat(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
            }

            // Prepare expense data
            const expenseData = {
                employee_id: parseInt(employee_id),
                category: category.trim(),
                expense_date: expense_date,
                merchant_vendor_name: merchant_vendor_name.trim(),
                description: description.trim(),
                amount: parseFloat(amount)
            };

            // Add receipt data if uploaded
            if (req.file) {
                expenseData.receipt_path = req.file.path.replace(/\\/g, '/');
                expenseData.receipt_original_name = req.file.originalname;
                expenseData.receipt_file_type = req.file.mimetype;
                expenseData.receipt_size = req.file.size;
            }

            // Create expense claim
            const result = await ExpenseModel.createExpense(expenseData);

            return res.status(201).json({
                success: true,
                message: 'Expense claim submitted successfully',
                data: {
                    id: result.id,
                    claim_number: result.claim_number
                }
            });

        } catch (error) {
            console.error('Submit expense error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to submit expense claim'
            });
        }
    }

    // Get all expenses
    static async getExpenses(req, res) {
        try {
            const {
                status,
                category,
                employee_id,
                start_date,
                end_date,
                search,
                page = 1,
                limit = 50
            } = req.query;

            const filters = {};

            // Apply filters
            if (status) filters.status = status;
            if (category) filters.category = category;
            if (employee_id) filters.employee_id = employee_id;
            if (start_date) filters.start_date = start_date;
            if (end_date) filters.end_date = end_date;
            if (search) filters.search = search;

            // Add pagination
            filters.limit = parseInt(limit);
            filters.offset = (parseInt(page) - 1) * parseInt(limit);

            // Get expenses
            const result = await ExpenseModel.getAllExpenses(filters);

            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: Math.ceil(result.total / result.limit)
                }
            });

        } catch (error) {
            console.error('Get expenses error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch expenses'
            });
        }
    }

    // Get expense by ID
    static async getExpenseById(req, res) {
        try {
            const { id } = req.params;

            const expense = await ExpenseModel.getExpenseById(id);
            
            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: expense
            });

        } catch (error) {
            console.error('Get expense by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch expense'
            });
        }
    }

    // Get expense statistics
    static async getExpenseStats(req, res) {
        try {
            const stats = await ExpenseModel.getExpenseStats();

            return res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Get expense stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch expense statistics'
            });
        }
    }

    // Get categories
    static async getCategories(req, res) {
        try {
            const categories = await ExpenseModel.getCategories();

            return res.status(200).json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('Get categories error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch categories'
            });
        }
    }

    // Approve expense
    static async approveExpense(req, res) {
        try {
            const { id } = req.params;
            const { user_id, username, name, notes } = req.body;
            
            // Prepare user data
            const userData = {
                user_id: user_id,
                username: username || user_id,
                name: name || 'Admin User'
            };

            // Check if expense exists
            const expense = await ExpenseModel.getExpenseById(id);
            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            // Check if already approved/rejected
            if (expense.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Expense is already approved'
                });
            }

            if (expense.status === 'rejected') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot approve a rejected expense'
                });
            }

            // Approve the expense
            const success = await ExpenseModel.updateExpenseStatus(id, 'approved', userData, notes);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Expense approved successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to approve expense'
                });
            }

        } catch (error) {
            console.error('Approve expense error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to approve expense'
            });
        }
    }

    // Reject expense
    static async rejectExpense(req, res) {
        try {
            const { id } = req.params;
            const { user_id, username, name, notes } = req.body;

            if (!notes || notes.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            // Prepare user data
            const userData = {
                user_id: user_id,
                username: username || user_id,
                name: name || 'Admin User'
            };

            // Check if expense exists
            const expense = await ExpenseModel.getExpenseById(id);
            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            // Check if already approved/rejected
            if (expense.status === 'rejected') {
                return res.status(400).json({
                    success: false,
                    message: 'Expense is already rejected'
                });
            }

            if (expense.status === 'approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot reject an approved expense'
                });
            }

            // Reject the expense
            const success = await ExpenseModel.updateExpenseStatus(id, 'rejected', userData, notes);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Expense rejected successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to reject expense'
                });
            }

        } catch (error) {
            console.error('Reject expense error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to reject expense'
            });
        }
    }

    // Download receipt
    static async downloadReceipt(req, res) {
        try {
            const { id } = req.params;

            const expense = await ExpenseModel.getExpenseById(id);
            
            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

            if (!expense.receipt_path) {
                return res.status(404).json({
                    success: false,
                    message: 'No receipt found for this expense'
                });
            }

            // Check if file exists
            if (!fs.existsSync(expense.receipt_path)) {
                return res.status(404).json({
                    success: false,
                    message: 'Receipt file not found on server'
                });
            }

            // Determine content type
            let contentType = 'application/octet-stream';
            const fileExtension = path.extname(expense.receipt_path).toLowerCase();
            
            if (fileExtension === '.pdf') {
                contentType = 'application/pdf';
            } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
                contentType = 'image/jpeg';
            } else if (fileExtension === '.png') {
                contentType = 'image/png';
            }

            // Set headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${expense.receipt_original_name || 'receipt' + fileExtension}"`);
            
            // Send the file
            res.download(expense.receipt_path, expense.receipt_original_name, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    if (!res.headersSent) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to download file'
                        });
                    }
                }
            });

        } catch (error) {
            console.error('Download receipt error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to download receipt'
            });
        }
    }

    // Delete expense
    static async deleteExpense(req, res) {
        try {
            const { id } = req.params;

            // Delete expense
            const success = await ExpenseModel.deleteExpense(id);

            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Expense deleted successfully'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Expense not found'
                });
            }

        } catch (error) {
            console.error('Delete expense error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete expense'
            });
        }
    }
}

module.exports = ExpenseController;