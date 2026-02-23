const { query } = require("../config/db");

const EmployeeAdvanceModel = {
  // =====================================================
  // CREATE ADVANCE REQUEST
  // =====================================================
  createRequest: async ({
    employee_id,
    advance_amount,
    installments,
    required_by,
    reason_for_advance,
    supporting_doc,
  }) => {
    const sql = `
      INSERT INTO employee_advances (
        employee_id,
        advance_amount,
        installments,
        monthly_deduction,
        required_by,
        reason_for_advance,
        balance_amount,
        supporting_doc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const monthly_deduction = Number(advance_amount) / Number(installments);

    const result = await query(sql, [
      employee_id,
      advance_amount,
      installments,
      monthly_deduction,
      required_by,
      reason_for_advance,
      advance_amount,
      supporting_doc,
    ]);

    return result.insertId;
  },

  // =====================================================
  // APPROVE ADVANCE
  // =====================================================
  approveAdvance: async (id, { remark, approved_by }) => {
    const sql = `
      UPDATE employee_advances
      SET status = 'approved',remark = ?,
          approved_by = ?,
          approved_at = NOW()
      WHERE id = ?
    `;

    const result = await query(sql, [remark, approved_by, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // get all
  // =====================================================
  getAllAdvance: async () => {
    const sql = `
      SELECT ea.id, ea.employee_id as employee_id, CONCAT(he.first_name ," ",he.last_name) as employee_name, he.employee_code as employee_code, he.salary as salary, he.email as employee_email, he.phone as employee_phone, d.name as employee_department, he.designation as employee_designation, ea.advance_amount as amount,ea.reason_for_advance as reason,ea.required_by as request_date, ea.installments as installments, ea.status as status, ea.approved_by as approved_by, ea.disbursed_at as disbursement_date, ea.total_recovered as total_recovered, ea.balance_amount as balance_amount, ea.monthly_deduction as monthly_deduction, he.salary_type as salary_type, ea.remark as remark  FROM employee_advances as ea LEFT JOIN hrms_employees as he ON he.id=ea.employee_id LEFT JOIN departments as d ON d.id=he.department_id  ORDER BY ea.created_at DESC
    `;

    const result = await query(sql);
    return result;
  },

  // =====================================================
  // REJECT ADVANCE
  // =====================================================
  rejectAdvance: async (id, emp_id, remark) => {
    const sql = `
      UPDATE employee_advances
      SET status = 'rejected', approved_by=?, remark = ?
      WHERE id = ?
    `;

    const result = await query(sql, [emp_id, remark, id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // MARK AS DISBURSED (START RECOVERY)
  // =====================================================
  markDisbursed: async (id) => {
    const sql = `
      UPDATE employee_advances
      SET status = 'recovering',
          disbursed_at = NOW()
      WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  // =====================================================
  // GET SINGLE ADVANCE
  // =====================================================
  getById: async (id) => {
    const sql = `
      SELECT *
      FROM employee_advances
      WHERE id = ?
    `;

    const [rows] = await query(sql, [id]);
    return rows[0] || null;
  },

  // =====================================================
  // GET EMPLOYEE ADVANCES
  // =====================================================
  getByEmployee: async (employee_id) => {
    const [employee] = await query(
      "select * from hrms_employees where user_id=?",
      [employee_id],
    );

    const sql = `
      SELECT ea.id, ea.employee_id as employee_id, CONCAT(he.first_name ," ",he.last_name) as employee_name, he.employee_code as employee_code, he.salary as salary, he.email as employee_email, he.phone as employee_phone, d.name as employee_department, he.designation as employee_designation, ea.advance_amount as amount,ea.reason_for_advance as reason,ea.required_by as request_date, ea.installments as installments, ea.status as status, ea.approved_by as approved_by, ea.disbursed_at as disbursement_date, ea.total_recovered as total_recovered, ea.balance_amount as balance_amount, ea.monthly_deduction as monthly_deduction, he.salary_type as salary_type, ea.remark as remark  FROM employee_advances as ea LEFT JOIN hrms_employees as he ON he.id=ea.employee_id LEFT JOIN departments as d ON d.id=he.department_id where employee_id = ?  ORDER BY ea.created_at DESC
    `;

    const rows = await query(sql, [employee.id]);
    console.log(rows);
    return rows;
  },

  // =====================================================
  // CLOSE ADVANCE
  // =====================================================
  closeAdvance: async (id) => {
    const sql = `
      UPDATE employee_advances
      SET status = 'closed'
      WHERE id = ?
    `;

    const [result] = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  deleteAdvance: async (id) => {
    const sql = `
      DELETE FROM employee_advances WHERE id = ?
    `;

    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },
};

module.exports = EmployeeAdvanceModel;
