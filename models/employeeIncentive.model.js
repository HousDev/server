const db = require("../config/db");

const EmployeeIncentiveModel = {
  // =====================================================
  // CREATE INCENTIVE
  // =====================================================
  createIncentive: async ({
    employee_id,
    incentive_type,
    month,
    year,
    amount,
    description,
    created_by,
  }) => {
    const query = `
      INSERT INTO employee_incentives (
        employee_id,
        incentive_type,
        month,
        year,
        amount,
        description,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      employee_id,
      incentive_type,
      month,
      year,
      amount,
      description,
      created_by,
    ]);

    return result.insertId;
  },

  // =====================================================
  // APPROVE INCENTIVE
  // =====================================================
  approveIncentive: async (id, approved_by) => {
    const query = `
      UPDATE employee_incentives
      SET status = 'approved', approved_by= ?, approved_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [approved_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // REJECT INCENTIVE
  // =====================================================
  rejectIncentive: async (id, rejected_by) => {
    const query = `
      UPDATE employee_incentives
      SET status = 'rejected', approved_by= ?, approved_at = NOW()
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
      UPDATE employee_incentives
      SET status = 'paid'
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // GET SINGLE INCENTIVE
  // =====================================================
  getById: async (id) => {
    const query = `
      SELECT *
      FROM employee_incentives
      WHERE id = ?
    `;

    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  },

  // =====================================================
  // GET EMPLOYEE INCENTIVES
  // =====================================================
  getByEmployee: async (employee_id) => {
    const query = `
      SELECT *
      FROM employee_incentives
      WHERE employee_id = ?
      ORDER BY year DESC, month DESC
    `;

    const [rows] = await db.execute(query, [employee_id]);
    return rows;
  },

  // =====================================================
  // GET BY MONTH & YEAR (PAYROLL USE)
  // =====================================================
  getByMonthYear: async (month, year) => {
    const query = `
      SELECT *
      FROM employee_incentives
      WHERE month = ?
      AND year = ?
    `;

    const [rows] = await db.execute(query, [month, year]);
    return rows;
  },
};

module.exports = EmployeeIncentiveModel;
