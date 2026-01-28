const db = require("../config/db");

const AttendanceModel = {
  punchIn(data, callback) {
    const sql = `
      INSERT INTO attendance (user_id, type, latitude, longitude, address, selfie, work_type, shift_info)
      VALUES (?, 'in', ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [
        data.userId,
        data.latitude,
        data.longitude,
        data.address,
        data.selfie,
        data.workType,
        data.shiftInfo,
      ],
      callback,
    );
  },

  punchOut(data, callback) {
    const sql = `
      INSERT INTO attendance (user_id, type, latitude, longitude, address, selfie)
      VALUES (?, 'out', ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [data.userId, data.latitude, data.longitude, data.address, data.selfie],
      callback,
    );
  },

  getStatus(userId, callback) {
    const sql = `
      SELECT type FROM attendance
      WHERE user_id = ?
      ORDER BY timestamp DESC LIMIT 1
    `;
    db.query(sql, [userId], callback);
  },

  getHistory(userId, callback) {
    const sql = `
      SELECT * FROM attendance
      WHERE user_id = ?
      ORDER BY timestamp DESC
    `;
    db.query(sql, [userId], callback);
  },
};

module.exports = AttendanceModel;
