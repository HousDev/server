// controllers/attendanceController.js
const { query } = require("../config/db");
const attendanceModel = require("../models/attendanceModel");
const fs = require("fs").promises;
const db = require("../config/db");

class AttendanceController {
  OFFICE_LOCATION = {
    latitude: 18.6055756,
    longitude: 73.7842205,
  };

  MAX_DISTANCE_METERS = 500;

  calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  isWithinRadius = (lat1, lon1, lat2, lon2, maxDistance) => {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= maxDistance;
  };

  getFileUrl = (filename) => {
    if (!filename) return null;
    return `${process.env.BASE_URL || "http://localhost:4000"}/uploads/${filename}`;
  };

  // ---------------- CHECK ATTENDANCE STATUS ---------------- //
  checkAttendance = async (req, res) => {
    try {
      const { user_id } = req.params;
      const status = await attendanceModel.checkAttendanceStatus(user_id);

      return res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: "Error checking status",
      });
    }
  };

  adminMarkAttendance = async (req, res) => {
    try {
      const { user_id, status, punch_in_time } = req.body;

      const [existngOne] = await db.query(
        "SELECT * FROM attendance where date=? AND user_id=?",
        [punch_in_time.slice(0, 10), user_id],
      );
      if (existngOne) {
        await db.query(
          "update  attendance set user_id = ?, status = ?, punch_in_time = ?, date = ? where id = ?  ",
          [
            user_id,
            status,
            punch_in_time,
            punch_in_time.slice(0, 10),
            existngOne.id,
          ],
        );
      } else {
        await db.query(
          "INSERT into attendance(user_id,status,punch_in_time, date) values(?,?,?,?) ",
          [user_id, status, punch_in_time, punch_in_time.slice(0, 10)],
        );
      }

      return res
        .status(200)
        .json({ message: "Attendance updated.", success: true });
    } catch (error) {
      console.log(error);
      return res.stats(500).json({ message: "Internal Server Error." });
    }
  };

  // ---------------- PUNCH IN ---------------- //
  punchIn = async (req, res) => {
    try {
      const {
        user_id,
        latitude,
        longitude,
        punch_in_address,
        punch_out_address,
      } = req.body;

      if (!user_id || !latitude || !longitude)
        return res.status(400).json({
          success: false,
          message: "user_id, latitude, longitude required",
        });

      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Selfie image is required" });

      const withinRange = this.isWithinRadius(
        parseFloat(latitude),
        parseFloat(longitude),
        this.OFFICE_LOCATION.latitude,
        this.OFFICE_LOCATION.longitude,
        this.MAX_DISTANCE_METERS,
      );

      if (!withinRange) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: `You must be within ${this.MAX_DISTANCE_METERS}m of office`,
        });
      }

      const existing = await attendanceModel.getTodayByUser(user_id);
      if (existing) {
        await fs.unlink(req.file.path);
        return res
          .status(400)
          .json({ success: false, message: "Already punched in today" });
      }

      const [existingEmployee] = await query(
        "SELECT * FROM hrms_employees WHERE user_id = ?",
        [user_id],
      );

      if (!existingEmployee) {
        return res
          .status(400)
          .json({ success: false, message: "Employee not found." });
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "your-app-name",
          },
        },
      );

      const data = await response.json();

      const attendanceId = await attendanceModel.create({
        user_id: existingEmployee.id,
        date: new Date().toISOString().split("T")[0],
        punch_in_time: new Date(),
        punch_in_latitude: parseFloat(latitude),
        punch_in_longitude: parseFloat(longitude),
        punch_in_location: data.display_name,
        punch_in_selfie: req.file.filename,
        status: "present",
        punch_in_address,
        punch_out_address,
      });

      return res.json({
        success: true,
        message: "Punch in successful",
        data: {
          id: attendanceId,
          selfie_url: this.getFileUrl(req.file.filename),
        },
      });
    } catch (error) {
      console.error("❌ Punch in error:", error.message);
      if (req.file)
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  // ---------------- PUNCH OUT ---------------- //
  punchOut = async (req, res) => {
    try {
      const {
        user_id,
        latitude,
        longitude,
        work_notes = "",
        punch_out_address,
      } = req.body;

      if (!user_id || !latitude || !longitude)
        return res.status(400).json({
          success: false,
          message: "user_id, latitude, longitude required",
        });

      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Selfie image is required" });
      const [employeeData] = await query(
        "SELECT * FROM hrms_employees WHERE user_id = ?",
        [user_id],
      );
      const attendance = await attendanceModel.getTodayByUser(employeeData.id);

      if (!attendance)
        return res
          .status(400)
          .json({ success: false, message: "No punch in found today" });

      if (attendance.punch_out_time)
        return res
          .status(400)
          .json({ success: false, message: "Already punched out today" });

      const punchInTime = new Date(attendance.punch_in_time);
      const punchOutTime = new Date();
      const hoursWorked = (
        (punchOutTime - punchInTime) /
        (1000 * 60 * 60)
      ).toFixed(2);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "your-app-name",
          },
        },
      );

      const data = await response.json();

      await attendanceModel.update(attendance.id, {
        punch_out_time: punchOutTime,
        punch_out_latitude: parseFloat(latitude),
        punch_out_longitude: parseFloat(longitude),
        punch_out_location: data.display_name,
        punch_out_selfie: req.file.filename,
        total_hours: hoursWorked,
        work_notes,
        punch_out_address,
      });

      return res.json({
        success: true,
        message: "Punch out successful",
        data: {
          id: attendance.id,
          hours_worked: hoursWorked,
        },
      });
    } catch (error) {
      console.error("❌ Punch out error:", error.message);
      if (req.file)
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  addNoteForAttendance = async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    const attendance = await attendanceModel.addNote(id, note);
    return res.json({
      success: true,
      data: attendance || null,
      message: "Note added successfully.",
    });
  };

  // ---------------- TODAY STATUS ---------------- //
  getTodayStatus = async (req, res) => {
    const { user_id } = req.params;
    const attendance = await attendanceModel.getTodayByUser(user_id);

    return res.json({
      success: true,
      data: attendance || null,
    });
  };

  getTodayAll = async (req, res) => {
    const attendance = await attendanceModel.getTodayAll();

    return res.json({
      success: true,
      data: attendance || [],
    });
  };

  async getAttendanceByMonthRangeController(req, res) {
    try {
      const { startMonth, endMonth } = req.query;

      // ✅ Validation
      if (!startMonth || !endMonth) {
        return res.status(400).json({
          success: false,
          message: "startMonth and endMonth are required (format: YYYY-MM)",
        });
      }

      const data = await attendanceModel.getAttendanceByMonthRange(
        startMonth,
        endMonth,
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("❌ Controller Error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  getLastAttendanceOfUser = async (req, res) => {
    const { user_id } = req.params;
    const attendance =
      await attendanceModel.getTodayByUserLastAttendance(user_id);
    return res.json({
      success: true,
      data: attendance,
    });
  };

  // ---------------- CURRENT MONTH ATTENDANCE ---------------- //
  getCurrentMonthAttendance = async (req, res) => {
    try {
      const { user_id, yearMonth } = req.params;

      const attendance = await attendanceModel.getUserAttendanceOfCurrentMonth(
        user_id,
        yearMonth,
      );

      return res.json({
        success: true,
        data: attendance || [],
      });
    } catch (error) {
      console.error(
        "❌ Error in getCurrentMonthAttendance controller:",
        error.message,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch current month attendance",
      });
    }
  };

  // ---------------- HISTORY ---------------- //
  getHistory = async (req, res) => {
    const { user_id } = req.params;
    const history = await attendanceModel.getHistory(user_id);

    return res.json({
      success: true,
      data: history || [],
    });
  };

  // ---------------- STATISTICS ---------------- //
  getStatistics = async (req, res) => {
    const { start_date, end_date } = req.query;
    const stats = await attendanceModel.getStatistics(start_date, end_date);

    return res.json({
      success: true,
      data: stats,
    });
  };
  getTodaysStatistics = async (req, res) => {
    const stats = await attendanceModel.getTodaysStatistics();
    return res.json({
      success: true,
      data: stats,
    });
  };

  // ---------------- EMPLOYEE ATTENDANCE REPORT (RANGE BASED) ---------------- //
  getEmployeeAttendanceReport = async (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      // Validate required parameters
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "start_date and end_date are required",
        });
      }

      // Validate date format
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      // Call the model function
      const report = await attendanceModel.getEmployeeAttendanceSummary(
        start_date,
        end_date,
      );

      // Calculate summary statistics
      const summary = {
        total_employees: report.length,
        total_present_days: 0,
        total_half_days: 0,
        total_absent_days: 0,
        total_paid_leaves: 0,
        total_late_arrivals: 0,
        total_working_hours: 0,
        average_attendance_percentage: 0,
      };

      // Aggregate summary data
      report.forEach((employee) => {
        summary.total_present_days += employee.present_days;
        summary.total_half_days += employee.half_days;
        summary.total_absent_days += employee.absent_days;
        summary.total_paid_leaves += employee.paid_leaves;
        summary.total_late_arrivals += employee.late_arrivals;
        summary.total_working_hours += employee.total_working_hours;
        summary.average_attendance_percentage += employee.attendance_percentage;
      });

      if (report.length > 0) {
        summary.average_attendance_percentage = Math.round(
          summary.average_attendance_percentage / report.length,
        );
      }

      return res.json({
        success: true,
        data: {
          date_range: {
            start_date,
            end_date,
          },
          summary,
          employees: report,
        },
      });
    } catch (error) {
      console.error(
        "❌ Error in getEmployeeAttendanceReport controller:",
        error.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch employee attendance report",
        error: error.message,
      });
    }
  };
}

module.exports = new AttendanceController();
