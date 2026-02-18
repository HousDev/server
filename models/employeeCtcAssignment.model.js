const { query } = require("../config/db");

const EmployeeCTCAssignmentModel = {
  // =====================================================
  // ASSIGN TEMPLATE TO EMPLOYEE
  // =====================================================
  assignTemplate: async ({
    employee_id,
    template_id,
    ctc_amount,
    effective_from,
  }) => {
    const sql = `
      INSERT INTO employee_ctc_assignments (
        employee_id,
        template_id,
        ctc_amount,
        effective_from
      )
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [
      employee_id,
      template_id,
      ctc_amount,
      effective_from,
    ]);

    return result.insertId;
  },

  // =====================================================
  // UPDATE ASSIGNMENT
  // =====================================================
  updateAssignment: async (id, { template_id, ctc_amount, effective_from }) => {
    const sql = `
      UPDATE employee_ctc_assignments
      SET template_id = ?,
          ctc_amount = ?,
          effective_from = ?
      WHERE id = ?
    `;

    const [result] = await query(sql, [
      template_id,
      ctc_amount,
      effective_from,
      id,
    ]);

    return result.affectedRows > 0;
  },

  // =====================================================
  // GET CURRENT ASSIGNMENT OF EMPLOYEE
  // =====================================================
  getByEmployee: async (employee_id) => {
    const sql = `
      SELECT *
      FROM employee_ctc_assignments
      WHERE employee_id = ?
      ORDER BY effective_from DESC
      LIMIT 1
    `;

    const [rows] = await query(sql, [employee_id]);
    return rows[0] || null;
  },

  // =====================================================
  // GET FULL HISTORY
  // =====================================================
  getHistoryByEmployee: async (employee_id) => {
    const sql = `
      SELECT *
      FROM employee_ctc_assignments
      WHERE employee_id = ?
      ORDER BY effective_from DESC
    `;

    const [rows] = await query(sql, [employee_id]);
    return rows;
  },

  // =====================================================
  // DELETE ASSIGNMENT
  // =====================================================
  deleteAssignment: async (id) => {
    const sql = `
      DELETE FROM employee_ctc_assignments
      WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },
};

module.exports = EmployeeCTCAssignmentModel;
