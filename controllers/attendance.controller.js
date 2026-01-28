const Attendance = require("../models/attendance.model");

exports.punchIn = (req, res) => {
  const data = {
    userId: req.body.userId,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    address: req.body.address,
    selfie: req.file ? req.file.filename : null,
    workType: req.body.workType,
    shiftInfo: req.body.shiftInfo,
  };

  Attendance.punchIn(data, (err) => {
    if (err)
      return res.status(500).json({ error: "Punch-in failed", details: err });
    return res.json({ message: "Punch-in successful", selfie: data.selfie });
  });
};

exports.punchOut = (req, res) => {
  const data = {
    userId: req.body.userId,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    address: req.body.address,
    selfie: req.file ? req.file.filename : null,
  };

  Attendance.punchOut(data, (err) => {
    if (err)
      return res.status(500).json({ error: "Punch-out failed", details: err });
    return res.json({ message: "Punch-out successful", selfie: data.selfie });
  });
};

exports.getStatus = (req, res) => {
  Attendance.getStatus(req.params.userId, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch status" });

    const last = results.length ? results[0].type : "out";
    return res.json({ current_cycle: last });
  });
};

exports.getHistory = (req, res) => {
  Attendance.getHistory(req.params.userId, (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch history" });

    return res.json(rows);
  });
};
