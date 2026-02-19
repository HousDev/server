const { query } = require("../config/db");

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
    const sql = `
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

    const result = await query(sql, [
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
    const sql = `
      UPDATE employee_incentives
      SET status = 'approved', approved_by= ?, approved_at = NOW()
      WHERE id = ?
    `;

    const result = await query(sql, [approved_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // REJECT INCENTIVE
  // =====================================================
  rejectIncentive: async (id, rejected_by) => {
    const sql = `
      UPDATE employee_incentives SET status = 'rejected', approved_by= ?, approved_at = NOW()
      WHERE id = ?
    `;

    const result = await query(sql, [rejected_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // MARK AS PAID
  // =====================================================
  markAsPaid: async (id) => {
    const sql = `
      UPDATE employee_incentives
      SET status = 'paid'
      WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // GET SINGLE INCENTIVE
  // =====================================================
  getById: async (id) => {
    const sql = `
      SELECT *
      FROM employee_incentives
      WHERE id = ?
    `;

    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  deleteById: async (id) => {
    const sql = `
      DELETE FROM employee_incentives
      WHERE id = ?
    `;

    const rows = await query(sql, [id]);

    return rows || null;
  },

  // =====================================================
  // GET EMPLOYEE INCENTIVES
  // =====================================================
  getByEmployee: async (employee_id) => {
    const sql = `
      SELECT *
      FROM employee_incentives
      WHERE employee_id = ?
      ORDER BY year DESC, month DESC
    `;

    const [rows] = await query(sql, [employee_id]);
    return rows;
  },

  // =====================================================
  // GET BY MONTH & YEAR (PAYROLL USE)
  // =====================================================
  getByMonthYear: async (month, year) => {
    const sql = `
      SELECT *
      FROM employee_incentives
      WHERE month = ?
      AND year = ?
    `;

    const [rows] = await query(sql, [month, year]);
    return rows;
  },

  getAllIncentives: async (month, year) => {
    const sql = `SELECT ei.*, he.employee_code as employee_code, CONCAT(he.first_name," ",he.last_name) as employee_name,he.salary as employee_ctc, ei.approved_at as approved_date, u.full_name as approved_by_name FROM employee_incentives as ei LEFT JOIN hrms_employees as he ON he.id=ei.employee_id LEFT JOIN users as u ON u.id = ei.approved_by ORDER BY created_at DESC`;

    const rows = await query(sql);
    return rows;
  },
};

module.exports = EmployeeIncentiveModel;
