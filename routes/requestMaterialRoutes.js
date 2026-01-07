const express = require("express");

const requestMaterialRoute = express.Router();
const requestMaterialController = require("../controllers/requestMaterialController");

// 1️⃣ Create a new request material
requestMaterialRoute.post("/", requestMaterialController.createRequestMaterial);

// 2️⃣ Get all request materials
requestMaterialRoute.get("/", requestMaterialController.getAllRequestMaterials);

// 3️⃣ Update status of a request material
requestMaterialRoute.put(
  "/status/:id",
  requestMaterialController.updateRequestMaterialStatus
);

module.exports = requestMaterialRoute;
