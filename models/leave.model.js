const { promisePool } = require("../config/db");

const LeaveModel = {
  // Get all leaves
  getAllLeaves: async (filters = {}) => {
    let query = `
      SELECT 
        l.*,
        l.approved_by_username,
        l.approved_by_name,
        l.rejected_by_username,
        l.rejected_by_name
      FROM hrms_leaves l
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
      params.push(filters.is_half_day === 'true' || filters.is_half_day === true);
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
      [id]
    );
    return rows[0];
  },
  
  // Create new leave application with half day support
  createLeave: async (leaveData) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get latest sequence number
    const [seqRows] = await promisePool.query(
      "SELECT COUNT(*) as count FROM hrms_leaves WHERE YEAR(applied_at) = ? AND MONTH(applied_at) = ?",
      [year, month]
    );
    
    const sequence = (seqRows[0].count || 0) + 1;
    const application_number = `LV/${year}/${month}/${String(sequence).padStart(4, '0')}`;
    
    // For half day, ensure to_date = from_date
    if (leaveData.is_half_day) {
      leaveData.to_date = leaveData.from_date;
    }
    
    // Calculate total days if not provided
    if (!leaveData.total_days && leaveData.is_half_day) {
      leaveData.total_days = 0.5;
    }
    
    // Insert leave
    const [result] = await promisePool.query(
      "INSERT INTO hrms_leaves SET ?",
      { 
        ...leaveData, 
        application_number,
        applied_at: new Date()
      }
    );
    
    return { id: result.insertId, application_number };
  },
  
  // Update leave status with half day support
  updateLeaveStatus: async (id, status, userData, reason = null) => {
    const updateData = {
      status,
      updated_at: new Date()
    };
    
    if (status === 'approved') {
      // Store both ID and username
      const userIdStr = userData.user_id || userData.id || '';
      let numericUserId = null;
      
      // Try to extract numbers from the user_id string
      if (userIdStr) {
        const match = userIdStr.match(/\d+/);
        if (match) {
          numericUserId = parseInt(match[0], 10);
        }
      }
      
      updateData.approved_by = userIdStr; // Store string user_id
      updateData.approved_by_username = userData.username || userIdStr || 'unknown';
      updateData.approved_by_name = userData.name || 'Unknown User';
      updateData.approved_at = new Date();
      
      // Clear rejection fields
      updateData.rejected_by = null;
      updateData.rejected_by_username = null;
      updateData.rejected_by_name = null;
      updateData.rejected_at = null;
      updateData.rejection_reason = null;
      
    } else if (status === 'rejected') {
      // Store both ID and username
      const userIdStr = userData.user_id || userData.id || '';
      let numericUserId = null;
      
      if (userIdStr) {
        const match = userIdStr.match(/\d+/);
        if (match) {
          numericUserId = parseInt(match[0], 10);
        }
      }
      
      updateData.rejected_by = userIdStr; // Store string user_id
      updateData.rejected_by_username = userData.username || userIdStr || 'unknown';
      updateData.rejected_by_name = userData.name || 'Unknown User';
      updateData.rejected_at = new Date();
      updateData.rejection_reason = reason;
      
      // Clear approval fields
      updateData.approved_by = null;
      updateData.approved_by_username = null;
      updateData.approved_by_name = null;
      updateData.approved_at = null;
    }
    
    console.log('Updating leave with data:', updateData);
    
    const [result] = await promisePool.query(
      "UPDATE hrms_leaves SET ? WHERE id = ?",
      [updateData, id]
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
  
  // Get on leave today with half day support
  getOnLeaveToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await promisePool.query(
      `SELECT COUNT(DISTINCT employee_id) as count
       FROM hrms_leaves
       WHERE status = 'approved'
       AND from_date <= ?
       AND to_date >= ?`,
      [today, today]
    );
    return rows[0].count;
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
      params.push(filters.is_half_day === 'true' || filters.is_half_day === true);
    }
    
    const [rows] = await promisePool.query(query, params);
    return rows[0].total;
  }
};

module.exports = LeaveModel;