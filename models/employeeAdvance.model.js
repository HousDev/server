const db = require("../config/db");

const EmployeeAdvanceModel = {
  // =====================================================
  // CREATE ADVANCE REQUEST
  // =====================================================
  createRequest: async ({
    employee_id,
    advance_amount,
    installments,
    monthly_deduction,
    required_by,
    reason_for_advance,
    supporting_doc,
  }) => {
    const query = `
      INSERT INTO employee_advances (
        employee_id,
        advance_amount,
        installments,
        monthly_deduction,
        required_by,
        reason_for_advance,
        supporting_doc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      employee_id,
      advance_amount,
      installments,
      monthly_deduction,
      required_by,
      reason_for_advance,
      supporting_doc,
    ]);

    return result.insertId;
  },

  // =====================================================
  // APPROVE ADVANCE
  // =====================================================
  approveAdvance: async (id, { approved_by }) => {
    const query = `
      UPDATE employee_advances
      SET status = 'approved',
          approved_by = ?,
          approved_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [approved_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // REJECT ADVANCE
  // =====================================================
  rejectAdvance: async (id, emp_id) => {
    const query = `
      UPDATE employee_advances
      SET status = 'rejected',approved_by=?
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [emp_id, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // MARK AS DISBURSED (START RECOVERY)
  // =====================================================
  markDisbursed: async (id) => {
    const query = `
      UPDATE employee_advances
      SET status = 'recovering',
          disbursed_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // GET SINGLE ADVANCE
  // =====================================================
  getById: async (id) => {
    const query = `
      SELECT *
      FROM employee_advances
      WHERE id = ?
    `;

    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  },

  // =====================================================
  // GET EMPLOYEE ADVANCES
  // =====================================================
  getByEmployee: async (employee_id) => {
    const query = `
      SELECT *
      FROM employee_advances
      WHERE employee_id = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query, [employee_id]);
    return rows;
  },

  // =====================================================
  // CLOSE ADVANCE
  // =====================================================
  closeAdvance: async (id) => {
    const query = `
      UPDATE employee_advances
      SET status = 'closed'
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  },
};

module.exports = EmployeeAdvanceModel;
