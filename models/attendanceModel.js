// models/attendanceModel.js - UPDATED FOR YOUR DB CONFIG
const db = require("../config/db");
function getAllDates(start, end) {
  const dates = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
class AttendanceModel {
  // ✅ MAIN FUNCTION
  async getEmployeeAttendanceSummary(start_date, end_date) {
    try {
      // 1. Get employees
      const employees = await db.query(`
      SELECT 
        id,
        CONCAT(first_name, ' ', last_name) as employee_name,
        employee_code,
        emp_punch_in_time
      FROM hrms_employees
      WHERE employee_status = 'active'
    `);

      if (!employees.length) return [];

      // 2. Attendance grouped by DAY (IMPORTANT FIX)
      const attendance = await db.query(
        `
      SELECT 
        user_id,
        DATE(punch_in_time) as date,
        MIN(punch_in_time) as first_in,
        MAX(punch_out_time) as last_out,
        SUM(IFNULL(total_hours, 0)) as total_hours
      FROM attendance
      WHERE DATE(punch_in_time) BETWEEN ? AND ?
      GROUP BY user_id, DATE(punch_in_time)
      `,
        [start_date, end_date],
      );

      // 3. Leaves
      const leaves = await db.query(
        `
      SELECT 
        employee_id,
        from_date,
        to_date,
        is_half_day
      FROM hrms_leaves
      WHERE status = 'approved'
      AND (
        (from_date BETWEEN ? AND ?) OR
        (to_date BETWEEN ? AND ?) OR
        (from_date <= ? AND to_date >= ?)
      )
      `,
        [start_date, end_date, start_date, end_date, start_date, end_date],
      );

      // 4. Date range
      const allDates = getAllDates(start_date, end_date);

      const FULL_DAY = 8;
      const HALF_DAY = 4;

      const result = [];

      for (const emp of employees) {
        const empAttendance = attendance.filter((a) => a.user_id === emp.id);
        const empLeaves = leaves.filter((l) => l.employee_id === emp.id);

        let present = 0;
        let half = 0;
        let absent = 0;
        let leave = 0;
        let late = 0;

        for (const date of allDates) {
          const day = date.toISOString().split("T")[0];

          // Skip Sunday
          if (date.getDay() === 0) continue;

          const record = empAttendance.find((a) => a.date == day);

          // 🔍 Check leave
          let isLeave = false;
          let isHalfLeave = false;

          for (const l of empLeaves) {
            if (day >= l.from_date && day <= l.to_date) {
              isLeave = true;
              isHalfLeave = l.is_half_day === 1;
              break;
            }
          }

          if (record) {
            const hours = parseFloat(record.total_hours || 0);

            // Status
            if (hours >= FULL_DAY) {
              present++;
            } else if (hours >= HALF_DAY) {
              half++;
              present += 0.5;
            } else {
              absent++;
            }

            // Late check
            if (record.first_in) {
              const punchTime = record.first_in.split(" ")[1];
              const shiftTime = emp.emp_punch_in_time || "10:00:00";

              if (punchTime > shiftTime) {
                late++;
              }
            }
          } else if (isLeave) {
            leave += isHalfLeave ? 0.5 : 1;
          } else {
            absent++;
          }
        }

        const totalDays = allDates.filter((d) => d.getDay() !== 0).length;

        const presentEquivalent = present + leave;
        const percentage =
          totalDays > 0 ? Math.round((presentEquivalent / totalDays) * 100) : 0;

        result.push({
          employee_id: emp.id,
          employee_name: emp.employee_name,
          employee_code: emp.employee_code,
          total_working_days: totalDays,
          present_days: Number(present.toFixed(1)),
          half_days: half,
          absent_days: absent,
          paid_leaves: leave,
          late_arrivals: late,
          attendance_percentage: percentage,
        });
      }

      return result;
    } catch (err) {
      console.error("❌ Error:", err);
      throw err;
    }
  }

  // Helper function to get all dates in a range
  getAllDatesInRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Helper function to calculate working days (excluding Sundays)
  getWorkingDaysCount(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Exclude Sundays (day 0) - adjust based on your weekend policy
      if (dayOfWeek !== 0) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  // Helper function to calculate hours difference
  calculateHoursDifference(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffHours = (end - start) / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100;
  }

  // Helper function to calculate working days (excluding Sundays)
  getWorkingDaysCount(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Exclude Sundays (day 0) - adjust based on your weekend policy
      if (dayOfWeek !== 0) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  // Helper function to get date range between two dates
  getDateRange(leaveStart, leaveEnd, rangeStart, rangeEnd) {
    const dates = [];
    const start = new Date(Math.max(leaveStart, new Date(rangeStart)));
    const end = new Date(Math.min(leaveEnd, new Date(rangeEnd)));

    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Helper function to calculate hours difference
  calculateHoursDifference(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffHours = (end - start) / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100;
  }
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
         DATE_FORMAT(a.punch_in_time, '%Y-%m-%dT%h:%i:%s %p') as punch_in_time,
         DATE_FORMAT(a.punch_out_time, '%Y-%m-%dT%h:%i:%s %p') as punch_out_time,
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

  async getAttendanceByMonthRange(
    startMonth, // format: "YYYY-MM" → "2025-05"
    endMonth, // format: "YYYY-MM" → "2026-05"
  ) {
    try {
      const rows = await db.query(
        `SELECT 
         a.*,
         DATE_FORMAT(a.punch_in_time, '%Y-%m-%dT%h:%i:%s %p') as punch_in_time,
         DATE_FORMAT(a.punch_out_time, '%Y-%m-%dT%h:%i:%s %p') as punch_out_time,
         CONCAT(u.first_name, ' ', u.last_name) AS user_name,
         u.employee_code AS employee_code
       FROM attendance a
       LEFT JOIN hrms_employees u ON u.id = a.user_id
       WHERE DATE_FORMAT(a.date, '%Y-%m') BETWEEN ? AND ?
       ORDER BY a.date ASC, a.punch_in_time ASC`,
        [startMonth, endMonth],
      );

      return rows;
    } catch (error) {
      console.error("❌ Error in getAttendanceByMonthRange:", error.message);
      return [];
    }
  }

  async getUserAttendanceOfCurrentMonth(user_id, yearMonth) {
    try {
      const [employeeData] = await db.query(
        "SELECT * FROM hrms_employees WHERE user_id = ?",
        [user_id],
      );

      if (!employeeData) return [];

      const firstDay = `${yearMonth}-01`;

      const rows = await db.query(
        `SELECT 
          a.*, 
          CONCAT(u.first_name, ' ', u.last_name) AS user_name, 
          u.employee_code AS employee_code
       FROM attendance a
       LEFT JOIN hrms_employees u ON u.id = a.user_id
       WHERE a.user_id = ?
       AND a.date >= ?
       AND a.date < DATE_ADD(?, INTERVAL 1 MONTH)
       ORDER BY a.date DESC`,
        [employeeData.id, firstDay, firstDay],
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

  async addNote(id, note) {
    try {
      const result = await db.query(
        `UPDATE attendance 
         SET note = ?
         WHERE id = ?`,
        [note, id],
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

      return rows.length > 0
        ? rows[0]
        : {
            total_employees: 0,
            present_today: 0,
            currently_present: 0,
            avg_working_hours: 0,
          };
    } catch (error) {
      // console.error("❌ Error in getStatistics:", error.message);
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
      // console.error("❌ Error in getStatistics:", error.message);
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
