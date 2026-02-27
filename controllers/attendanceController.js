// controllers/attendanceController.js
const { query } = require("../config/db");
const attendanceModel = require("../models/attendanceModel");
const fs = require("fs").promises;

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
      console.log(user_id, req.body);
      console.log(punch_in_address, punch_out_address);

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
      console.log("data of emp", existingEmployee);
      if (!existingEmployee) {
        return res
          .status(400)
          .json({ success: false, message: "Employee not found." });
      }
      const attendanceId = await attendanceModel.create({
        user_id: existingEmployee.id,
        date: new Date().toISOString().split("T")[0],
        punch_in_time: new Date(),
        punch_in_latitude: parseFloat(latitude),
        punch_in_longitude: parseFloat(longitude),
        punch_in_location: `Lat: ${latitude}, Long: ${longitude}`,
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
    console.log("Body:", req.body);
    console.log("File:", req.file);

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

      console.log("today last attendance", attendance);
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

      await attendanceModel.update(attendance.id, {
        punch_out_time: punchOutTime,
        punch_out_latitude: parseFloat(latitude),
        punch_out_longitude: parseFloat(longitude),
        punch_out_location: `Lat: ${latitude}, Long: ${longitude}`,
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
      const { user_id } = req.params;

      const attendance =
        await attendanceModel.getUserAttendanceOfCurrentMonth(user_id);

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
}

module.exports = new AttendanceController();
