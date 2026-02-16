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

    const [result] = await db.execute(query, [
      employee_id,
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

    const [result] = await db.execute(query, [approved_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // REJECT
  // =====================================================
  rejectRequest: async (id, rejected_by) => {
    const query = `
      UPDATE employee_reimbursements
      SET status = 'rejected',approved_by=?, approved_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [rejected_by, id]);
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

    const [result] = await db.execute(query, [id]);
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
    const query = `
      SELECT *
      FROM employee_reimbursements
      WHERE employee_id = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [employee_id]);
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

    const [rows] = await db.execute(query, [id]);
    if (rows[0].status !== "pending") {
      return null;
    } else {
      const query = `
      DELETE
      FROM employee_reimbursements
      WHERE id = ?
    `;

      const [rows] = await db.execute(query, [id]);
      return rows || null;
    }
  },
};

module.exports = EmployeeReimbursementModel;
