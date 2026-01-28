// server.cjs
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const itemsRoutes = require("./routes/items.routes");
const vendorRoutes = require("./routes/vendorRoutes");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
const miscPoRoutes = require("./routes/miscPoRoutes");
const poTrackingRoutes = require("./routes/poTrackingRoutes");
const projectRoutes = require("./routes/projectRoutes");
const poTypesRoutes = require("./routes/poTypesRoutes");
const serviceTypesRoutes = require("./routes/serviceTypesRoutes");
const serviceOrderRoutes = require("./routes/serviceOrderRoutes");
const { pool } = require("./config/db");
const roleRoutes = require("./routes/roleRoutes");
const termsConditionsRouter = require("./routes/termsConditionsRouter.js");
const InventoryRouter = require("./routes/InventoryRouter.js");
const InventoryTransactionRouter = require("./routes/inventoryTransactionRoute.js");
const NotificationRoute = require("./routes/notificationsRoute.js");
const workflowRoutes = require("./routes/workflowRoutes.js");
const path = require("path");
const ProjectDetailsRouter = require("./routes/proectDetailsRoutes.js");
const templateRoutes = require("./routes/templateRoutes.js");
const requestMaterialRoute = require("./routes/requestMaterialRoutes.js");
const logsRoutes = require("./routes/logsRoutes.js");
const pdfRouter = require("./generatePdf/pdfRoutes.js");
const poPaymentRouter = require("./routes/poPaymentRouter.js");
const poPaymentReminderRoutes = require("./routes/poPaymentReminderRoutes.js");
const startPoPaymentReminderCron = require("./corn/poPaymentReminder.cron.js");
const areaTasksRoutes = require("./routes/areaTasks.router.js");
const areaSubTasksRoutes = require("./routes/subTask.router.js");
const dailyLogsRoutes = require("./routes/subTaskLogs.route.js");
const employeeRoute = require("./routes/employees.router.js");
const companyRoutes = require("./routes/companyRoutes");
const securitySettingsRoutes = require('./routes/securitySettings.routes');
const leaveRoutes = require("./routes/leave.routes");
const expenseRoutes = require('./routes/expense.routes');
const ticketRoutes = require("./routes/ticket.routes.js");

const departmentRoutes = require("./routes/departmentRoutes");
dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
// public
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/po-material-tracking", poTrackingRoutes);
app.use("/api", miscPoRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/po_types", poTypesRoutes);
app.use("/api/service-types", serviceTypesRoutes);
app.use("/api/service-orders", serviceOrderRoutes);
// Routes
app.use("/api/roles", roleRoutes);
app.use("/api/terms-conditions", termsConditionsRouter);
app.use("/api/inventory", InventoryRouter);
app.use("/api/inventory-transaction", InventoryTransactionRouter);
app.use("/api/notifications", NotificationRoute);
app.use("/api/workflow", workflowRoutes);
// ⭐ REMOVE /api prefix - uploads should be served at root level
app.use("/uploads", express.static(path.join(__dirname, "uploads")));app.use("/api/project-details", ProjectDetailsRouter);
app.use("/api/templates", templateRoutes);
app.use("/api/requestMaterial", requestMaterialRoute);
app.use("/api/logs", logsRoutes);
app.use("/api/pdf", pdfRouter);
app.use("/api/po-payments", poPaymentRouter);
app.use("/api/po-payment-reminders", poPaymentReminderRoutes);
app.use("/api/area-tasks", areaTasksRoutes);
app.use("/api/area-sub-tasks", areaSubTasksRoutes);
app.use("/api/area-task-daily-logs", dailyLogsRoutes);
app.use("/api/employees", employeeRoute);
app.use("/api/companies", companyRoutes);
app.use('/api/security-settings', securitySettingsRoutes);
app.use("/api/leaves", leaveRoutes);
app.use('/api/expenses', expenseRoutes);
app.use("/api/tickets", ticketRoutes);


app.use("/api/departments", departmentRoutes);
startPoPaymentReminderCron();
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await pool.getConnection();
    console.log("Connected to DB");
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
})();
