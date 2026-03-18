const db = require("../config/db");

const EmployeeReimbursementModel = {
  // =====================================================
  // CREATE REIMBURSEMENT
  // =====================================================
  createRequest: async ({
    employee_id,
    category,
    amount,
    description,
    doc,
  }) => {
    const [emp] = await db.query(
      `SELECT * FROM hrms_employees WHERE user_id = ?`,
      [employee_id],
    );

    if (!emp) {
      throw new Error("Employee not found");
    }

    const query = `
    INSERT INTO employee_reimbursements (
      employee_id,
      category,
      amount,
      description,
      doc
    )
    VALUES (?, ?, ?, ?, ?)
  `;

    const result = await db.query(query, [
      emp.id,
      category,
      amount,
      description,
      doc,
    ]);

    return result.insertId;
  },

  // =====================================================
  // UPDATE (ONLY WHEN PENDING)
  // =====================================================
  updateRequest: async (id, { category, amount, description, doc }) => {
    const query = `
      UPDATE employee_reimbursements
      SET category = ?,
          amount = ?,
          description = ?,
          doc = ?
      WHERE id = ?
      AND status = 'pending'
    `;

    const [result] = await db.execute(query, [
      category,
      amount,
      description,
      doc,
      id,
    ]);

    return result.affectedRows > 0;
  },

  getAll: async () => {
    const query = `
      SELECT er.*, concat(e.first_name, ' ', e.last_name) as employee_name, e.employee_code, u.full_name as approved_by_name
      FROM employee_reimbursements er LEFT JOIN hrms_employees e ON er.employee_id = e.id LEFT JOIN users u ON er.approved_by = u.id
      ORDER BY created_at DESC
    `;
    const rows = await db.query(query);
    return rows;
  },

  // =====================================================
  // APPROVE
  // =====================================================
  approveRequest: async (id, { approved_by }) => {
    const query = `
      UPDATE employee_reimbursements
      SET status = 'approved',
          approved_by = ?,
          approved_at = NOW()
      WHERE id = ?
    `;

    const result = await db.query(query, [approved_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // REJECT
  // =====================================================
  rejectRequest: async (id, { rejected_by, reason }) => {
    const query = `
      UPDATE employee_reimbursements
      SET status = 'rejected',approved_by=?, rejection_reason=?, approved_at = NOW()
      WHERE id = ?
    `;

    const result = await db.query(query, [rejected_by, reason, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // MARK AS PAID
  // =====================================================
  markAsPaid: async (id) => {
    const query = `
      UPDATE employee_reimbursements
      SET status = 'paid'
      WHERE id = ?
    `;

    const result = await db.query(query, [id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // GET SINGLE
  // =====================================================
  getById: async (id) => {
    const query = `
      SELECT *
      FROM employee_reimbursements
      WHERE id = ?
    `;

    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  },

  // =====================================================
  // GET EMPLOYEE REQUESTS
  // =====================================================
  getByEmployee: async (employee_id) => {
    const [emp] = await db.query(
      `SELECT * FROM hrms_employees where user_id = ?`,
      [employee_id],
    );

    const query = `
      SELECT er.*, concat(e.first_name, ' ', e.last_name) as employee_name, e.employee_code, u.full_name as approved_by_name
      FROM employee_reimbursements er LEFT JOIN hrms_employees e ON er.employee_id = e.id LEFT JOIN users u ON er.approved_by = u.id where er.employee_id = ? 
      ORDER BY created_at DESC
    `;

    const rows = await db.query(query, [emp.id]);
    console.log(rows);
    return rows;
  },

  // =====================================================
  // GET APPROVED (PAYROLL USE)
  // =====================================================
  getApproved: async () => {
    const query = `
      SELECT *
      FROM employee_reimbursements
      WHERE status = 'approved'
    `;

    const [rows] = await db.execute(query);
    return rows;
  },

  deleteById: async (id) => {
    const query = `
      SELECT *
      FROM employee_reimbursements
      WHERE id = ?
    `;

    const [rows] = await db.query(query, [id]);
    if (rows.status !== "pending") {
      return null;
    } else {
      const query = `
      DELETE
      FROM employee_reimbursements
      WHERE id = ?
    `;

      const rows = await db.query(query, [id]);
      return rows || null;
    }
  },
};

module.exports = EmployeeReimbursementModel;
