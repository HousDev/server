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


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
// public
app.use('/api/auth', authRoutes);
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
