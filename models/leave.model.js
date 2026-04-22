const { promisePool } = require("../config/db");

const LeaveModel = {
  // Get all leaves
  getAllLeaves: async (filters = {}) => {
    let query = `
      SELECT 
        l.*, u.full_name as approved_by_name, concat(he.first_name," ",he.last_name) as emp_name
      FROM hrms_leaves l LEFT JOIN users AS u ON l.approved_by = u.id LEFT JOIN hrms_employees he on he.id=l.employee_id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (filters.status) {
      query += " AND l.status = ?";
      params.push(filters.status);
    }

    if (filters.leave_type) {
      query += " AND l.leave_type = ?";
      params.push(filters.leave_type);
    }

    if (filters.start_date) {
      query += " AND l.from_date >= ?";
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += " AND l.to_date <= ?";
      params.push(filters.end_date);
    }

    if (filters.is_half_day !== undefined) {
      query += " AND l.is_half_day = ?";
      params.push(
        filters.is_half_day === "true" || filters.is_half_day === true,
      );
    }

    if (filters.employee_id !== undefined) {
      query += " AND l.employee_id = ?";
      params.push(filters.employee_id);
    }

    if (filters.search) {
      query += " AND (l.application_number LIKE ? OR l.reason LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Sorting
    query += " ORDER BY l.applied_at DESC";

    // Pagination
    if (filters.limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await promisePool.query(query, params);
    return rows;
  },

  // Get single leave by ID
  getLeaveById: async (id) => {
    const [rows] = await promisePool.query(
      `SELECT * FROM hrms_leaves WHERE id = ?`,
      [id],
    );
    return rows[0];
  },

  // Create new leave application with half day support - FIXED with transaction
  createLeave: async (leaveData) => {
    const connection = await promisePool.getConnection();

    try {
      await connection.beginTransaction();

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");

      // ⭐ FIXED: Use MAX() instead of COUNT() to get the highest sequence
      const [seqRows] = await connection.query(
        `SELECT COALESCE(MAX(
        CAST(SUBSTRING_INDEX(application_number, '/', -1) AS UNSIGNED)
      ), 0) as max_seq
       FROM hrms_leaves 
       WHERE YEAR(applied_at) = ? AND MONTH(applied_at) = ?
       FOR UPDATE`,
        [year, month],
      );

      const sequence = seqRows[0].max_seq + 1;
      const application_number = `LV/${year}/${month}/${String(sequence).padStart(4, "0")}`;

      // For half day, ensure to_date = from_date
      if (leaveData.is_half_day) {
        leaveData.to_date = leaveData.from_date;
      }

      // Calculate total days if not provided
      if (Boolean(leaveData.is_half_day)) {
        leaveData.total_days = 0.5;
      }

      // Insert leave
      const [result] = await connection.query("INSERT INTO hrms_leaves SET ?", {
        ...leaveData,
        application_number,
        applied_at: new Date(),
      });
      const empData = await connection.query(
        `SELECT * FROM hrms_employees WHERE id = ?`,
        [leaveData.employee_id],
      );

      await connection.execute(
        `INSERT INTO notifications
         (title, description, type)
         VALUES (?, ?, ?)`,
        [
          "New Leave Request.",
          "New Leave Request From " +
            empData[0][0].first_name +
            " " +
            empData[0][0].last_name,
          "Request",
        ],
      );

      await connection.commit();

      return { id: result.insertId, application_number };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update leave status with half day support
  updateLeaveStatus: async (id, status, userData, reason = null) => {
    const updateData = {
      status,
      updated_at: new Date(),
    };

    if (status === "approved") {
      // Store both ID and username
      const userIdStr = userData.user_id || userData.id || "";
      let numericUserId = null;

      // Try to extract numbers from the user_id string
      if (userIdStr) {
        const match = userIdStr.match(/\d+/);
        if (match) {
          numericUserId = parseInt(match[0], 10);
        }
      }

      updateData.approved_by = userIdStr;
      updateData.approved_at = new Date();

      // Clear rejection fields
      updateData.rejected_by = null;
      updateData.rejected_at = null;
      updateData.rejection_reason = null;
    } else if (status === "rejected") {
      // Store both ID and username
      const userIdStr = userData.user_id || userData.id || "";
      let numericUserId = null;

      if (userIdStr) {
        const match = userIdStr.match(/\d+/);
        if (match) {
          numericUserId = parseInt(match[0], 10);
        }
      }

      updateData.rejected_by = userIdStr;
      updateData.rejected_at = new Date();
      updateData.rejection_reason = reason;

      // Clear approval fields
      updateData.approved_by = null;
      updateData.approved_at = null;
    }

    const [result] = await promisePool.query(
      "UPDATE hrms_leaves SET ? WHERE id = ?",
      [updateData, id],
    );

    return result.affectedRows > 0;
  },

  // Delete leave
  deleteLeave: async (id) => {
    const [result] = await promisePool.query(
      "DELETE FROM hrms_leaves WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  },

  // Get leave statistics with half day support
  getLeaveStats: async () => {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN is_half_day = 1 THEN 1 ELSE 0 END) as half_day_total,
        SUM(CASE WHEN is_half_day = 1 AND status = 'pending' THEN 1 ELSE 0 END) as half_day_pending,
        SUM(CASE WHEN is_half_day = 1 AND status = 'approved' THEN 1 ELSE 0 END) as half_day_approved,
        SUM(CASE WHEN is_half_day = 1 AND status = 'rejected' THEN 1 ELSE 0 END) as half_day_rejected
      FROM hrms_leaves
    `;

    const [rows] = await promisePool.query(query);
    return rows[0];
  },

  getEmployeeLeaveStats: async (employeeId) => {
    const [[emp]] = await promisePool.query(
      `SELECT * FROM hrms_employees WHERE user_id = ?`,
      [employeeId],
    );

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN is_half_day = 1 THEN 1 ELSE 0 END) as half_day_total,
        SUM(CASE WHEN is_half_day = 1 AND status = 'pending' THEN 1 ELSE 0 END) as half_day_pending,
        SUM(CASE WHEN is_half_day = 1 AND status = 'approved' THEN 1 ELSE 0 END) as half_day_approved,
        SUM(CASE WHEN is_half_day = 1 AND status = 'rejected' THEN 1 ELSE 0 END) as half_day_rejected
      FROM hrms_leaves where employee_id = ?
    `;

    const [rows] = await promisePool.query(query, [emp.id]);
    return rows[0];
  },

  // Get on leave today with half day support
  getOnLeaveToday: async () => {
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await promisePool.query(
      `SELECT COUNT(DISTINCT employee_id) as count
       FROM hrms_leaves
       WHERE status = 'approved'
       AND from_date <= ?
       AND to_date >= ?`,
      [today, today],
    );
    return rows[0].count;
  },

  // Get employee leaves by month (handles overlap properly)
  getEmployeeLeavesByMonth: async (employeeId, yearMonth) => {
    try {
      const [[employeeData]] = await promisePool.query(
        "SELECT * FROM hrms_employees WHERE user_id = ?",
        [employeeId],
      );

      if (!employeeData) return [];
      const query = `
      SELECT 
        l.*, 
        u.full_name as approved_by_name, 
        CONCAT(he.first_name, ' ', he.last_name) as emp_name
      FROM hrms_leaves l
      LEFT JOIN users u ON l.approved_by = u.id
      LEFT JOIN hrms_employees he ON he.id = l.employee_id
      WHERE l.employee_id = ?
        AND (
          l.from_date <= LAST_DAY(CONCAT(?, '-01'))
          AND l.to_date >= CONCAT(?, '-01')
        ) AND l.status = 'approved'
      ORDER BY l.from_date ASC
    `;

      const [rows] = await promisePool.query(query, [
        employeeData.id,
        yearMonth,
        yearMonth,
      ]);

      return rows;
    } catch (error) {
      console.error("❌ Error in getEmployeeLeavesByMonth:", error.message);
      return [];
    }
  },

  // Get leave count (for pagination)
  getLeaveCount: async (filters = {}) => {
    let query = "SELECT COUNT(*) as total FROM hrms_leaves WHERE 1=1";
    const params = [];

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.leave_type) {
      query += " AND leave_type = ?";
      params.push(filters.leave_type);
    }

    if (filters.is_half_day !== undefined) {
      query += " AND is_half_day = ?";
      params.push(
        filters.is_half_day === "true" || filters.is_half_day === true,
      );
    }

    const [rows] = await promisePool.query(query, params);
    return rows[0].total;
  },
};

module.exports = LeaveModel;
