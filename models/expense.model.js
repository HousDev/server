const { query } = require("../config/db");

class ExpenseModel {
    // Generate claim number - FIXED VERSION
    static async generateClaimNumber() {
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        
        // Get the current maximum sequence for this month
        const result = await query(
            `SELECT claim_number 
             FROM hrms_expenses 
             WHERE claim_number LIKE CONCAT('EXP-', ?, '-%')
             ORDER BY claim_number DESC 
             LIMIT 1`,
            [yearMonth]
        );
        
        let nextSeq = 1;
        
        if (result.length > 0 && result[0].claim_number) {
            const lastClaimNumber = result[0].claim_number;
            // Extract the numeric part after the last dash
            const parts = lastClaimNumber.split('-');
            if (parts.length >= 3) {
                const lastSeq = parseInt(parts[2]) || 0;
                nextSeq = lastSeq + 1;
            }
        }
        
        return `EXP-${yearMonth}-${nextSeq.toString().padStart(4, '0')}`;
    }

    // Create expense
    static async createExpense(expenseData) {
        try {
            const claimNumber = await this.generateClaimNumber();
            
            console.log('Generated claim number:', claimNumber);
            
            const result = await query(
                `INSERT INTO hrms_expenses 
                (claim_number, employee_id, category, expense_date, merchant_vendor_name, 
                 description, amount, receipt_path, receipt_original_name, receipt_file_type, receipt_size, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    claimNumber,
                    expenseData.employee_id,
                    expenseData.category,
                    expenseData.expense_date,
                    expenseData.merchant_vendor_name,
                    expenseData.description,
                    expenseData.amount,
                    expenseData.receipt_path || null,
                    expenseData.receipt_original_name || null,
                    expenseData.receipt_file_type || null,
                    expenseData.receipt_size || null,
                    'pending_approval'
                ]
            );

            console.log('Expense created with ID:', result.insertId);

            return {
                id: result.insertId,
                claim_number: claimNumber
            };
        } catch (error) {
            console.error('Error creating expense:', error);
            
            // If it's a duplicate entry error, try once more with a different approach
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                console.log('Duplicate entry detected, generating alternative claim number');
                
                // Use timestamp-based approach as fallback
                const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const fallbackClaimNumber = `EXP-${yearMonth}-${timestamp}${random}`;
                
                console.log('Using fallback claim number:', fallbackClaimNumber);
                
                const result = await query(
                    `INSERT INTO hrms_expenses 
                    (claim_number, employee_id, category, expense_date, merchant_vendor_name, 
                     description, amount, receipt_path, receipt_original_name, receipt_file_type, receipt_size, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        fallbackClaimNumber,
                        expenseData.employee_id,
                        expenseData.category,
                        expenseData.expense_date,
                        expenseData.merchant_vendor_name,
                        expenseData.description,
                        expenseData.amount,
                        expenseData.receipt_path || null,
                        expenseData.receipt_original_name || null,
                        expenseData.receipt_file_type || null,
                        expenseData.receipt_size || null,
                        'pending_approval'
                    ]
                );

                return {
                    id: result.insertId,
                    claim_number: fallbackClaimNumber
                };
            }
            
            throw error;
        }
    }

    // Get all expenses - FIXED VERSION (No parameterized LIMIT/OFFSET)
    static async getAllExpenses(filters = {}) {
        try {
            // Build WHERE clause
            let conditions = [];
            let params = [];

            if (filters.status) {
                conditions.push("status = ?");
                params.push(filters.status);
            }

            if (filters.category) {
                conditions.push("category = ?");
                params.push(filters.category);
            }

            if (filters.employee_id) {
                conditions.push("employee_id = ?");
                params.push(filters.employee_id);
            }

            if (filters.start_date) {
                conditions.push("expense_date >= ?");
                params.push(filters.start_date);
            }

            if (filters.end_date) {
                conditions.push("expense_date <= ?");
                params.push(filters.end_date);
            }

            if (filters.search) {
                conditions.push(`(
                    claim_number LIKE ? OR 
                    merchant_vendor_name LIKE ? OR 
                    description LIKE ?
                )`);
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

            // Get total count
            const countResult = await query(
                `SELECT COUNT(*) as total FROM hrms_expenses ${whereClause}`,
                params
            );

            // Build SQL query - FIXED: Use template literals for LIMIT/OFFSET
            let sql = `SELECT * FROM hrms_expenses ${whereClause} ORDER BY created_at DESC`;
            
            // Add pagination if needed - Use template literals, not parameters
            const limit = parseInt(filters.limit) || 50;
            const offset = parseInt(filters.offset) || 0;
            
            if (limit > 0) {
                sql += ` LIMIT ${limit}`;
                if (offset > 0) {
                    sql += ` OFFSET ${offset}`;
                }
            }

            // Get data - Pass only WHERE clause params, not LIMIT/OFFSET params
            const rows = await query(sql, params);

            return {
                data: rows,
                total: countResult[0]?.total || 0,
                page: Math.floor(offset / limit) + 1,
                limit: limit
            };
        } catch (error) {
            console.error('Error getting all expenses:', error);
            throw error;
        }
    }

    // Get expense by ID
    static async getExpenseById(id) {
        try {
            const rows = await query(
                `SELECT * FROM hrms_expenses WHERE id = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting expense by ID:', error);
            throw error;
        }
    }

    // Update expense status
    static async updateExpenseStatus(id, status, userData, notes = '') {
        try {
            const result = await query(
                `UPDATE hrms_expenses 
                 SET status = ?, 
                     approver_id = ?,
                     approver_name = ?,
                     approval_date = NOW(),
                     approval_notes = ?,
                     rejection_reason = CASE WHEN ? = 'rejected' THEN ? ELSE NULL END,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    status,
                    userData.user_id,
                    userData.name || userData.username,
                    notes,
                    status,
                    status === 'rejected' ? notes : null,
                    id
                ]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating expense status:', error);
            throw error;
        }
    }

    // Get expense statistics
    static async getExpenseStats() {
        try {
            const stats = await query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(amount) as total_amount
                FROM hrms_expenses
                WHERE MONTH(expense_date) = MONTH(CURRENT_DATE())
                AND YEAR(expense_date) = YEAR(CURRENT_DATE())
            `);

            return stats[0] || {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                total_amount: 0
            };
        } catch (error) {
            console.error('Error getting expense stats:', error);
            throw error;
        }
    }

    // Delete expense
    static async deleteExpense(id) {
        try {
            const result = await query(
                'DELETE FROM hrms_expenses WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    // Get categories
    static async getCategories() {
        try {
            const rows = await query(
                `SELECT DISTINCT category 
                 FROM hrms_expenses 
                 WHERE category IS NOT NULL AND category != ''
                 ORDER BY category ASC`
            );
            
            return rows.map(row => row.category) || [];
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }
}

module.exports = ExpenseModel;