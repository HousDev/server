const cron = require("node-cron");
const { query } = require("../config/db");

function startPoPaymentReminderCron() {
  cron.schedule(
    "53 16 * * *", // 8:00 AM every day
    async () => {
      console.log("PO Payment Reminder cron running");
      const allPos = await query(`SELECT p.*, v.name AS vendor_name
      FROM purchase_orders p
      LEFT JOIN vendors v ON v.id = p.vendor_id where payment_status="pending" or payment_status="partial"
      ORDER BY p.created_at DESC`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Format using local time
      const tomorrowStr =
        tomorrow.getFullYear() +
        "-" +
        String(tomorrow.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(tomorrow.getDate()).padStart(2, "0");

      const dueTomorrowPOs = allPos.filter(
        (po) => po.due_date === tomorrowStr && Number(po.balance_amount) > 0
      );

      for (const po of dueTomorrowPOs) {
        await query(
          `INSERT INTO po_payment_reminder (
      po_id,
      po_number,
      vendor,
      total_amount,
      total_paid,
      balance_amount,
      due_date,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            po.id,
            po.po_number,
            po.vendor_name,
            po.grand_total,
            po.total_paid,
            po.balance_amount,
            po.due_date,
            "unseen",
          ]
        );
      }

      console.log(allPos);

      allPos;
      // logic will go here later
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
}

module.exports = startPoPaymentReminderCron;
