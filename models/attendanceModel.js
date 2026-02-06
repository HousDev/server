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
        `SELECT * FROM attendance 
         WHERE user_id = ? AND DATE(date) = CURDATE() `,
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
      console.log("🔵 Getting today's attendance for all users");

      const rows = await db.query(
        `SELECT 
  a.*,
  CONCAT(u.first_name, ' ', u.last_name) AS user_name,
  u.employee_code as employee_code,
  
FROM attendance a
LEFT JOIN hrms_employees u ON u.id = a.user_id
WHERE a.date = CURDATE()
ORDER BY a.punch_in_time ASC`,
      );
      console.log("this is rows", rows);

      return rows;
    } catch (error) {
      console.error("❌ Error in getTodayAll:", error.message);
      return [];
    }
  }

  // Get today's attendance by user
  async getTodayByUser(user_id) {
    try {
      console.log("🔵 Getting today attendance for user:", user_id);

      const rows = await db.query(
        `SELECT * FROM attendance 
         WHERE user_id = ? AND DATE(date) = CURDATE()`,
        [user_id],
      );

      console.log("✅ Found:", rows.length, "records");
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("❌ Error in getTodayByUser:", error.message);
      return null;
    }
  }

  // Check if user has active punch in
  async hasActivePunchIn(user_id) {
    try {
      console.log("🔵 Checking active punch in for user:", user_id);

      const rows = await db.query(
        `SELECT id FROM attendance 
         WHERE user_id = ? 
           AND DATE(date) = CURDATE() 
           AND punch_out_time IS NULL`,
        [user_id],
      );

      console.log("✅ Has active:", rows.length > 0);
      return rows.length > 0;
    } catch (error) {
      console.error("❌ Error in hasActivePunchIn:", error.message);
      return false;
    }
  }

  // Check attendance status
  async checkAttendanceStatus(user_id) {
    try {
      console.log("🔵 Checking attendance status for user:", user_id);

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
      console.log("🔵 Creating attendance:", data);

      const {
        user_id,
        date,
        punch_in_time,
        punch_in_location,
        punch_in_latitude,
        punch_in_longitude,
        punch_in_selfie,
        status,
      } = data;

      const result = await db.query(
        `INSERT INTO attendance (
          user_id, date, punch_in_time, punch_in_location,
          punch_in_latitude, punch_in_longitude, punch_in_selfie, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          date,
          punch_in_time,
          punch_in_location,
          punch_in_latitude,
          punch_in_longitude,
          punch_in_selfie,
          status || "present",
        ],
      );

      console.log("✅ Created attendance ID:", result.insertId);
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
      } = data;

      const result = await db.query(
        `UPDATE attendance 
         SET punch_out_time = ?,
             punch_out_location = ?,
             punch_out_latitude = ?,
             punch_out_longitude = ?,
             punch_out_selfie = ?,
             total_hours = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          punch_out_time,
          punch_out_location,
          punch_out_latitude,
          punch_out_longitude,
          punch_out_selfie,
          total_hours,
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
      console.log("🔵 Getting statistics from:", start_date, "to", end_date);

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

      console.log("✅ Statistics result:", rows[0]);
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
