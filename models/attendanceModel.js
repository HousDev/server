// models/attendanceModel.js - UPDATED FOR YOUR DB CONFIG
const db = require("../config/db");

class AttendanceModel {
  async getTodayByUserLastAttendance(user_id) {
    try {
      const [emp] = await db.query(
        "SELECT * FROM hrms_employees WHERE user_id = ?",
        [user_id],
      );

      const rows = await db.query(
        `SELECT *
         FROM attendance
         WHERE user_id = ?
         AND date = CURRENT_DATE
         ORDER BY created_at DESC
         LIMIT 1;`,
        [emp.id],
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("❌ Error in getTodayByUser:", error.message);
      return null;
    }
  }

  // Get today's attendance for all users
  async getTodayAll() {
    try {
      const rows = await db.query(
        `SELECT 
         a.*,
         CONCAT(u.first_name, ' ', u.last_name) AS user_name,
         u.employee_code AS employee_code
       FROM attendance a
       LEFT JOIN hrms_employees u ON u.id = a.user_id
       WHERE a.date = CURDATE()
       ORDER BY a.punch_in_time ASC`,
      );

      return rows;
    } catch (error) {
      console.error("❌ Error in getTodayAll:", error.message);
      return [];
    }
  }

  async getUserAttendanceOfCurrentMonth(user_id) {
    try {
      const [employeeData] = await db.query(
        "SELECT * from hrms_employees WHERE user_id = ?",
        [user_id],
      );
      const rows = await db.query(
        `SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.employee_code as employee_code
         FROM attendance a
         LEFT JOIN hrms_employees u ON u.id = a.user_id
         WHERE a.user_id = ?
         AND a.date BETWEEN
           DATE_FORMAT(CURDATE(), '%Y-%m-01')
           AND LAST_DAY(CURDATE()) ORDER BY date DESC`,
        [employeeData.id],
      );

      return rows;
    } catch (error) {
      console.error(
        "❌ Error in getUserAttendanceOfCurrentMonth:",
        error.message,
      );
      return [];
    }
  }

  // Get today's attendance by user
  async getTodayByUser(user_id) {
    try {
      const rows = await db.query(
        `SELECT * FROM attendance 
         WHERE user_id = ? AND DATE(date) = CURDATE() ORDER BY punch_in_time DESC LIMIT 1`,
        [user_id],
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("❌ Error in getTodayByUser:", error.message);
      return null;
    }
  }

  // Check if user has active punch in
  async hasActivePunchIn(user_id) {
    try {
      const rows = await db.query(
        `SELECT id FROM attendance 
         WHERE user_id = ? 
           AND DATE(date) = CURDATE() 
           AND punch_out_time IS NULL`,
        [user_id],
      );

      return rows.length > 0;
    } catch (error) {
      console.error("❌ Error in hasActivePunchIn:", error.message);
      return false;
    }
  }

  // Check attendance status
  async checkAttendanceStatus(user_id) {
    try {
      const attendance = await this.getTodayByUser(user_id);

      if (!attendance) {
        return {
          can_punch_in: true,
          can_punch_out: false,
          message: "You can punch in now",
        };
      }

      const canPunchOut =
        attendance.punch_in_time && !attendance.punch_out_time;

      return {
        can_punch_in: false,
        can_punch_out: canPunchOut,
        last_punch_in: attendance.punch_in_time,
        work_type: attendance.work_type || "office",
        message: canPunchOut ? "You can punch out now" : "Already punched out",
      };
    } catch (error) {
      console.error("❌ Error in checkAttendanceStatus:", error.message);

      return {
        can_punch_in: true,
        can_punch_out: false,
        message: "Error checking status",
      };
    }
  }

  // Create attendance
  async create(data) {
    try {
      const {
        user_id,
        date,
        punch_in_time,
        punch_in_location,
        punch_in_latitude,
        punch_in_longitude,
        punch_in_selfie,
        status,
        punch_in_address,
      } = data;

      const result = await db.query(
        `INSERT INTO attendance (
          user_id, date, punch_in_time, punch_in_location,
          punch_in_latitude, punch_in_longitude, punch_in_selfie, status, punch_in_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          date,
          punch_in_time,
          punch_in_location,
          punch_in_latitude,
          punch_in_longitude,
          punch_in_selfie,
          status || "present",
          punch_in_address || null,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error("❌ Error in create:", error.message);
      throw error;
    }
  }

  // Update attendance for punch out
  async update(id, data) {
    try {
      const {
        punch_out_time,
        punch_out_location,
        punch_out_latitude,
        punch_out_longitude,
        punch_out_selfie,
        total_hours,
        punch_out_address,
      } = data;

      const result = await db.query(
        `UPDATE attendance 
         SET punch_out_time = ?,
             punch_out_location = ?,
             punch_out_latitude = ?,
             punch_out_longitude = ?,
             punch_out_selfie = ?,
             total_hours = ?,
             updated_at = NOW(),
             punch_out_address = ?
         WHERE id = ?`,
        [
          punch_out_time,
          punch_out_location,
          punch_out_latitude,
          punch_out_longitude,
          punch_out_selfie,
          total_hours,
          punch_out_address || null,
          id,
        ],
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("❌ Error in update:", error.message);
      throw error;
    }
  }

  // ADD THIS METHOD - Get statistics
  async getStatistics(start_date, end_date) {
    try {
      const rows = await db.query(
        `SELECT 
          COUNT(DISTINCT user_id) as total_employees,
          COUNT(CASE WHEN DATE(date) = CURDATE() THEN 1 END) as present_today,
          COUNT(CASE WHEN DATE(date) = CURDATE() AND punch_out_time IS NULL THEN 1 END) as currently_present,
          AVG(total_hours) as avg_working_hours
         FROM attendance 
         WHERE date BETWEEN ? AND ?`,
        [start_date, end_date],
      );
      console.log(rows);

      return rows.length > 0
        ? rows[0]
        : {
            total_employees: 0,
            present_today: 0,
            currently_present: 0,
            avg_working_hours: 0,
          };
    } catch (error) {
      console.error("❌ Error in getStatistics:", error.message);
      return {
        total_employees: 0,
        present_today: 0,
        currently_present: 0,
        avg_working_hours: 0,
      };
    }
  }

  async getTodaysStatistics() {
    try {
      const rows = await db.query(
        `SELECT 
          COUNT(DISTINCT user_id) AS total_employees,
          COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) AS present_today,
          COUNT(CASE WHEN punch_out_time IS NULL THEN 1 END) AS currently_present,
          AVG(total_hours) AS avg_working_hours
          FROM (SELECT * FROM attendance WHERE date = CURDATE() Group by user_id)`,
      );

      return rows.length > 0
        ? rows[0]
        : {
            total_employees: 0,
            present_today: 0,
            currently_present: 0,
            avg_working_hours: 0,
          };
    } catch (error) {
      console.error("❌ Error in getStatistics:", error.message);
      return {
        total_employees: 0,
        present_today: 0,
        currently_present: 0,
        avg_working_hours: 0,
      };
    }
  }
}

module.exports = new AttendanceModel();
