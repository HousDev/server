// controllers/attendanceController.js
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
      const { user_id, latitude, longitude } = req.body;

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

      const attendanceId = await attendanceModel.create({
        user_id: parseInt(user_id),
        date: new Date().toISOString().split("T")[0],
        punch_in_time: new Date(),
        punch_in_latitude: parseFloat(latitude),
        punch_in_longitude: parseFloat(longitude),
        punch_in_location: `Lat: ${latitude}, Long: ${longitude}`,
        punch_in_selfie: req.file.filename,
        work_type,
        project_id: project_id ? parseInt(project_id) : null,
        project_location,
        status: "present",
      });

      return res.json({
        success: true,
        message: "Punch in successful",
        data: {
          id: attendanceId,
          selfie_url: this.getFileUrl(req.file.filename),
          work_type,
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
    console.log("🔵 PUNCH OUT API CALLED");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    try {
      const { user_id, latitude, longitude, work_notes = "" } = req.body;

      if (!user_id || !latitude || !longitude)
        return res.status(400).json({
          success: false,
          message: "user_id, latitude, longitude required",
        });

      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Selfie image is required" });

      const attendance = await attendanceModel.getTodayByUser(user_id);
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
    const { user_id } = req.params;
    const attendance = await attendanceModel.getTodayAll(user_id);
    console.log(attendance);
    return res.json({
      success: true,
      data: attendance || [],
    });
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
}

module.exports = new AttendanceController();

// // controllers/attendanceController.js
// const attendanceModel = require("../models/attendanceModel");
// const path = require("path");
// const fs = require("fs").promises;

// class AttendanceController {
//   // Office coordinates
//   OFFICE_LOCATION = {
//     latitude: 18.6055756,
//     longitude: 73.7842205,
//   };

//   MAX_DISTANCE_METERS = 500;

//   // ADD THIS METHOD - Calculate distance
//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   }

//   // ADD THIS METHOD - Check if within radius
//   isWithinRadius(lat1, lon1, lat2, lon2, maxDistance) {
//     const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
//     return distance <= maxDistance;
//   }

//   // Get file URL
//   getFileUrl(filename) {
//     if (!filename) return null;
//     return `${process.env.BASE_URL || "http://localhost:4000"}/uploads/${filename}`;
//   }

//   // Check Attendance Status
//   async checkAttendance(req, res) {
//     console.log("🔵 CHECK ATTENDANCE API CALLED for user:", req.params.user_id);

//     try {
//       const { user_id } = req.params;
//       const status = await attendanceModel.checkAttendanceStatus(user_id);

//       console.log("✅ Status response:", status);

//       res.json({
//         success: true,
//         data: status,
//       });
//     } catch (error) {
//       console.error("❌ Check attendance error:", error.message);

//       res.json({
//         success: false,
//         message: "Error checking status",
//         data: {
//           can_punch_in: true,
//           can_punch_out: false,
//           message: "You can try to punch in",
//         },
//       });
//     }
//   }

//   // Punch In
//   async punchIn(req, res) {
//     console.log("🔵 PUNCH IN API CALLED");
//     console.log("Body:", req.body);
//     console.log("File:", req.file);

//     try {
//       const {
//         user_id,
//         latitude,
//         longitude,
//         work_type = "office",
//         project_id,
//         project_location,
//       } = req.body;

//       // Validation
//       if (!user_id || !latitude || !longitude) {
//         return res.status(400).json({
//           success: false,
//           message: "user_id, latitude and longitude are required",
//         });
//       }

//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           message: "Selfie image is required",
//         });
//       }

//       // Check location for office work
//       if (work_type === "office") {
//         const withinRange = this.isWithinRadius(
//           parseFloat(latitude),
//           parseFloat(longitude),
//           this.OFFICE_LOCATION.latitude,
//           this.OFFICE_LOCATION.longitude,
//           this.MAX_DISTANCE_METERS,
//         );

//         if (!withinRange) {
//           await fs.unlink(req.file.path);
//           return res.status(400).json({
//             success: false,
//             message: `You must be within ${this.MAX_DISTANCE_METERS}m of office`,
//           });
//         }
//       }

//       // Check if already punched in
//       const existing = await attendanceModel.getTodayByUser(user_id);
//       if (existing) {
//         await fs.unlink(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "Already punched in today",
//         });
//       }

//       // Create attendance record
//       const attendanceId = await attendanceModel.create({
//         user_id: parseInt(user_id),
//         date: new Date().toISOString().split("T")[0],
//         punch_in_time: new Date(),
//         punch_in_location: `Lat: ${latitude}, Long: ${longitude}`,
//         punch_in_latitude: parseFloat(latitude),
//         punch_in_longitude: parseFloat(longitude),
//         punch_in_selfie: req.file.filename,
//         work_type,
//         project_id: project_id ? parseInt(project_id) : null,
//         project_location,
//         status: "present",
//       });

//       res.json({
//         success: true,
//         message: "Punch in successful",
//         data: {
//           id: attendanceId,
//           punch_in_time: new Date(),
//           selfie_url: this.getFileUrl(req.file.filename),
//           work_type,
//         },
//       });
//     } catch (error) {
//       console.error("❌ Punch in error:", error.message);

//       // Clean up file if error
//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (err) {
//           console.error("Error deleting file:", err);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: "Server error: " + error.message,
//       });
//     }
//   }

//   // Get Statistics
//   async getStatistics(req, res) {
//     try {
//       const { start_date, end_date } = req.query;

//       const currentDate = new Date().toISOString().split("T")[0];
//       const startDate = start_date || currentDate;
//       const endDate = end_date || currentDate;

//       console.log("🔵 Getting statistics for:", startDate, "to", endDate);

//       const statistics = await attendanceModel.getStatistics(
//         startDate,
//         endDate,
//       );

//       console.log("✅ Statistics:", statistics);

//       res.json({
//         success: true,
//         data: statistics,
//       });
//     } catch (error) {
//       console.error("❌ Get statistics error:", error.message);
//       res.status(500).json({
//         success: false,
//         message: "Server error",
//       });
//     }
//   }
// }

// module.exports = new AttendanceController();

// controllers/attendanceController.js
// const attendanceModel = require("../models/attendanceModel");
// const path = require("path");
// const fs = require("fs").promises;

// class AttendanceController {
//   // Office coordinates
//   OFFICE_LOCATION = {
//     latitude: 18.6055756,
//     longitude: 73.7842205,
//   };

//   MAX_DISTANCE_METERS = 500;

//   // Calculate distance
//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   }

//   // Check if within radius
//   isWithinRadius(lat1, lon1, lat2, lon2, maxDistance) {
//     const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
//     return distance <= maxDistance;
//   }

//   // Get file URL
//   getFileUrl(filename) {
//     if (!filename) return null;
//     return `${process.env.BASE_URL || "http://localhost:4000"}/uploads/${filename}`;
//   }

//   // 1. Check Attendance Status
//   async checkAttendance(req, res) {
//     console.log("🔵 CHECK ATTENDANCE API CALLED for user:", req.params.user_id);

//     try {
//       const { user_id } = req.params;
//       const status = await attendanceModel.checkAttendanceStatus(user_id);

//       console.log("✅ Status response:", status);

//       res.json({
//         success: true,
//         data: status,
//       });
//     } catch (error) {
//       console.error("❌ Check attendance error:", error.message);

//       res.json({
//         success: false,
//         message: "Error checking status",
//         data: {
//           can_punch_in: true,
//           can_punch_out: false,
//           message: "You can try to punch in",
//         },
//       });
//     }
//   }

//   // 2. Punch In
//   async punchIn(req, res) {
//     console.log("🔵 PUNCH IN API CALLED");
//     console.log("Body:", req.body);
//     console.log("File:", req.file);

//     try {
//       const {
//         user_id,
//         latitude,
//         longitude,
//         work_type = "office",
//         project_id,
//         project_location,
//       } = req.body;

//       // Validation
//       if (!user_id || !latitude || !longitude) {
//         return res.status(400).json({
//           success: false,
//           message: "user_id, latitude and longitude are required",
//         });
//       }

//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           message: "Selfie image is required",
//         });
//       }

//       // Check location for office work
//       if (work_type === "office") {
//         const withinRange = this.isWithinRadius(
//           parseFloat(latitude),
//           parseFloat(longitude),
//           this.OFFICE_LOCATION.latitude,
//           this.OFFICE_LOCATION.longitude,
//           this.MAX_DISTANCE_METERS,
//         );

//         if (!withinRange) {
//           await fs.unlink(req.file.path);
//           return res.status(400).json({
//             success: false,
//             message: `You must be within ${this.MAX_DISTANCE_METERS}m of office`,
//           });
//         }
//       }

//       // Check if already punched in
//       const existing = await attendanceModel.getTodayByUser(user_id);
//       if (existing) {
//         await fs.unlink(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "Already punched in today",
//         });
//       }

//       // Create attendance record
//       const attendanceId = await attendanceModel.create({
//         user_id: parseInt(user_id),
//         date: new Date().toISOString().split("T")[0],
//         punch_in_time: new Date(),
//         punch_in_location: `Lat: ${latitude}, Long: ${longitude}`,
//         punch_in_latitude: parseFloat(latitude),
//         punch_in_longitude: parseFloat(longitude),
//         punch_in_selfie: req.file.filename,
//         work_type,
//         project_id: project_id ? parseInt(project_id) : null,
//         project_location,
//         status: "present",
//       });

//       res.json({
//         success: true,
//         message: "Punch in successful",
//         data: {
//           id: attendanceId,
//           punch_in_time: new Date(),
//           selfie_url: this.getFileUrl(req.file.filename),
//           work_type,
//         },
//       });
//     } catch (error) {
//       console.error("❌ Punch in error:", error.message);

//       // Clean up file if error
//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (err) {
//           console.error("Error deleting file:", err);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: "Server error: " + error.message,
//       });
//     }
//   }

//   // 3. Punch Out
//   async punchOut(req, res) {
//     console.log("🔵 PUNCH OUT API CALLED");
//     console.log("Body:", req.body);
//     console.log("File:", req.file);

//     try {
//       const {
//         user_id,
//         latitude,
//         longitude,
//         work_notes = "",
//       } = req.body;

//       // Validation
//       if (!user_id || !latitude || !longitude) {
//         return res.status(400).json({
//           success: false,
//           message: "user_id, latitude and longitude are required",
//         });
//       }

//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           message: "Selfie image is required",
//         });
//       }

//       // Get today's attendance
//       const attendance = await attendanceModel.getTodayByUser(user_id);
//       if (!attendance) {
//         await fs.unlink(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "No punch in found for today",
//         });
//       }

//       if (attendance.punch_out_time) {
//         await fs.unlink(req.file.path);
//         return res.status(400).json({
//           success: false,
//           message: "Already punched out today",
//         });
//       }

//       // Calculate hours worked
//       const punchInTime = new Date(attendance.punch_in_time);
//       const punchOutTime = new Date();
//       const hoursWorked = ((punchOutTime - punchInTime) / (1000 * 60 * 60)).toFixed(2);

//       // Update attendance with punch out
//       await attendanceModel.update(attendance.id, {
//         punch_out_time: punchOutTime,
//         punch_out_location: `Lat: ${latitude}, Long: ${longitude}`,
//         punch_out_latitude: parseFloat(latitude),
//         punch_out_longitude: parseFloat(longitude),
//         punch_out_selfie: req.file.filename,
//         total_hours: hoursWorked,
//         work_notes,
//       });

//       res.json({
//         success: true,
//         message: "Punch out successful",
//         data: {
//           id: attendance.id,
//           punch_out_time: punchOutTime,
//           selfie_url: this.getFileUrl(req.file.filename),
//           hours_worked: hoursWorked,
//         },
//       });
//     } catch (error) {
//       console.error("❌ Punch out error:", error.message);

//       // Clean up file if error
//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (err) {
//           console.error("Error deleting file:", err);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: "Server error: " + error.message,
//       });
//     }
//   }

//   // 4. Get Today's Status
//   async getTodayStatus(req, res) {
//     try {
//       const { user_id } = req.params;

//       console.log("🔵 Getting today's status for user:", user_id);

//       const attendance = await attendanceModel.getTodayByUser(user_id);

//       if (!attendance) {
//         return res.json({
//           success: true,
//           data: null,
//           message: "No attendance record for today"
//         });
//       }

//       // Format response
//       const formattedData = {
//         id: attendance.id,
//         user_id: attendance.user_id,
//         date: attendance.date,
//         punch_in_time: attendance.punch_in_time,
//         punch_out_time: attendance.punch_out_time,
//         punch_in_selfie: attendance.punch_in_selfie ? this.getFileUrl(attendance.punch_in_selfie) : null,
//         punch_out_selfie: attendance.punch_out_selfie ? this.getFileUrl(attendance.punch_out_selfie) : null,
//         work_type: attendance.work_type || "office",
//         status: attendance.status || "present",
//         total_hours: attendance.total_hours || 0,
//         work_notes: attendance.work_notes || ""
//       };

//       res.json({
//         success: true,
//         data: formattedData
//       });
//     } catch (error) {
//       console.error("❌ Get today status error:", error.message);
//       res.status(500).json({
//         success: false,
//         message: "Server error"
//       });
//     }
//   }

//   // 5. Get History
//   async getHistory(req, res) {
//     try {
//       const { user_id } = req.params;
//       const { month, year, limit = 30 } = req.query;

//       console.log(`🔵 Getting history for user: ${user_id}`);

//       // Simple implementation - just return today's record
//       const history = await attendanceModel.getTodayByUser(user_id);

//       const historyList = history ? [{
//         date: history.date,
//         punch_in_time: history.punch_in_time,
//         punch_out_time: history.punch_out_time,
//         work_type: history.work_type,
//         status: history.status,
//         total_hours: history.total_hours
//       }] : [];

//       res.json({
//         success: true,
//         data: historyList
//       });
//     } catch (error) {
//       console.error("❌ Get history error:", error.message);
//       res.status(500).json({
//         success: false,
//         message: "Server error"
//       });
//     }
//   }

//   // 6. Get Statistics
//   async getStatistics(req, res) {
//     try {
//       const { start_date, end_date } = req.query;

//       const currentDate = new Date().toISOString().split("T")[0];
//       const startDate = start_date || currentDate;
//       const endDate = end_date || currentDate;

//       console.log("🔵 Getting statistics for:", startDate, "to", endDate);

//       const statistics = await attendanceModel.getStatistics(
//         startDate,
//         endDate,
//       );

//       console.log("✅ Statistics:", statistics);

//       res.json({
//         success: true,
//         data: statistics,
//       });
//     } catch (error) {
//       console.error("❌ Get statistics error:", error.message);
//       res.status(500).json({
//         success: false,
//         message: "Server error",
//       });
//     }
//   }
// }

// module.exports = new AttendanceController();
