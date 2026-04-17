// routes/generatedDocuments.routes.js
const express = require("express");
const generatedDocument = express.Router();
const controller = require("../controllers/generatedDocuments.controller");

// Routes
generatedDocument.post("/", controller.save);
generatedDocument.get("/", controller.getAll);
generatedDocument.get("/statistics", controller.getStatistics);
generatedDocument.get("/employee/:employee_id", controller.getByEmployee);
generatedDocument.get("/type/:doc_type", controller.getByType);
generatedDocument.get("/:id", controller.getById);
generatedDocument.delete("/:id", controller.delete);

module.exports = generatedDocument;
