// controllers/soSequenceController.js
const { pool } = require("../config/db");

/**
 * nextNumber() - internal helper that returns
 * { id, so_number, last_number }
 * Uses transaction to safely bump sequence for current year.
 */
async function nextNumber() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const year = new Date().getFullYear();

    // Ensure one row exists for this year (insert if missing)
    const [existing] = await conn.query(
      `SELECT * FROM so_sequences WHERE year = ? LIMIT 1 FOR UPDATE`,
      [year],
    );

    if (existing.length === 0) {
      const [ins] = await conn.query(
        `INSERT INTO so_sequences (prefix, last_number, year)
         VALUES (?, ?, ?)`,
        ["SO", 1, year],
      );

      const soNumber = `SO/${year}/${String(1).padStart(4, "0")}`;
      await conn.commit();

      return {
        id: ins.insertId,
        so_number: soNumber,
        last_number: 1,
      };
    }

    // row exists; lock and increment
    const row = existing[0];
    const newNumber = (row.last_number || 0) + 1;

    await conn.query(
      `UPDATE so_sequences
       SET last_number = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newNumber, row.id],
    );

    const soNumber = `WO/${year}/${String(newNumber).padStart(4, "0")}`;
    await conn.commit();

    return {
      id: row.id,
      so_number: soNumber,
      last_number: newNumber,
    };
  } catch (err) {
    await conn.rollback();
    console.error("soSequence.nextNumber error", err);
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Express handler if you want an HTTP endpoint GET /next
 */
async function next(req, res) {
  try {
    const result = await nextNumber();
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("soSequence.next error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

module.exports = {
  nextNumber,
  next,
};
