// // controllers/poSequenceController.js
// const { pool } = require("../config/db");

// /**
//  * Generate next PO number safely using SELECT ... FOR UPDATE
//  * Exports: next(req, res) for route usage, and nextNumber() for internal usage
//  */

// // internal helper: returns { po_number, number }
// async function nextNumber(prefix = "PO") {
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     const year = new Date().getFullYear();

//     // Ensure a row exists for this prefix+year
//     await conn.query(
//       `INSERT INTO po_sequences (prefix, last_number, year)
//        SELECT ?, 0, ? WHERE NOT EXISTS (SELECT 1 FROM po_sequences WHERE prefix = ? AND year = ?)`,
//       [prefix, year, prefix, year]
//     );

//     // Lock the row
//     const [rows] = await conn.query(
//       `SELECT id, last_number FROM po_sequences WHERE prefix = ? AND year = ? FOR UPDATE`,
//       [prefix, year]
//     );

//     if (!rows || rows.length === 0) {
//       throw new Error("po_sequences row missing after init");
//     }

//     const seqRow = rows[0];
//     const nextNum = (parseInt(seqRow.last_number, 10) || 0) + 1;

//     await conn.query(`UPDATE po_sequences SET last_number = ? WHERE id = ?`, [
//       nextNum,
//       seqRow.id,
//     ]);

//     await conn.commit();

//     const po_number = `${prefix}/${year}/${String(nextNum).padStart(4, "0")}`;
//     return { po_number, number: nextNum };
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// }

// // Express route handler (optional)
// async function next(req, res) {
//   try {
//     const result = await nextNumber();
//     res.json(result);
//   } catch (err) {
//     console.error("poSequenceController.next error", err);
//     res.status(500).json({ error: err.message || "internal" });
//   }
// }

// module.exports = {
//   next,
//   nextNumber, // export internal function if other modules want to call it directly
// };


// controllers/poSequenceController.js
const { pool } = require("../config/db");

/**
 * nextNumber() - internal helper that returns an object { id, po_number, last_number }
 * Uses transaction to safely bump sequence for current year.
 */
async function nextNumber() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const year = new Date().getFullYear();

    // Ensure one row exists for this year (insert if missing)
    const [existing] = await conn.query(
      `SELECT * FROM po_sequences WHERE year = ? LIMIT 1 FOR UPDATE`,
      [year]
    );

    if (existing.length === 0) {
      const [ins] = await conn.query(
        `INSERT INTO po_sequences (prefix, last_number, year) VALUES (?, ?, ?)`,
        ["PO", 1, year]
      );
      const poNumber = `PO/${year}/${String(1).padStart(4, "0")}`;
      await conn.commit();
      return { id: ins.insertId, po_number: poNumber, last_number: 1 };
    }

    // row exists; lock and increment
    const row = existing[0];
    const newNumber = (row.last_number || 0) + 1;

    await conn.query(`UPDATE po_sequences SET last_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
      newNumber,
      row.id,
    ]);

    const poNumber = `PO/${year}/${String(newNumber).padStart(4, "0")}`;
    await conn.commit();
    return { id: row.id, po_number: poNumber, last_number: newNumber };
  } catch (err) {
    await conn.rollback();
    console.error("poSequence.nextNumber error", err);
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
    console.error("poSequence.next error", err);
    return res.status(500).json({ error: err.message || "internal" });
  }
}

module.exports = {
  nextNumber,
  next,
};
