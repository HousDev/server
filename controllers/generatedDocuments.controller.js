// controllers/generatedDocuments.controller.js
const GeneratedDocumentsModel = require("../models/generatedDocuments.model");

const GeneratedDocumentsController = {
  // Save generated document
  save: async (req, res) => {
    console.log("dsfjkdshfkajshk");
    try {
      const { employee_id, doc_type, html_content } = req.body;

      if (!employee_id || !doc_type || !html_content) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: employee_id, doc_type, html_content",
        });
      }

      const id = await GeneratedDocumentsModel.create({
        employee_id,
        doc_type,
        html_content,
      });

      return res.status(201).json({
        success: true,
        message: "Document saved successfully",
        data: { id },
      });
    } catch (error) {
      console.error("Error saving document:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save document",
        error: error.message,
      });
    }
  },

  // Get all documents
  getAll: async (req, res) => {
    try {
      const { doc_type, employee_id } = req.query;
      const documents = await GeneratedDocumentsModel.getAll({
        doc_type,
        employee_id,
      });

      return res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch documents",
      });
    }
  },

  // Get document by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const document = await GeneratedDocumentsModel.getById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
        });
      }

      return res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Error fetching document:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch document",
      });
    }
  },

  // Get documents by employee
  getByEmployee: async (req, res) => {
    try {
      const { employee_id } = req.params;
      const documents =
        await GeneratedDocumentsModel.getByEmployeeId(employee_id);

      return res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch documents",
      });
    }
  },

  // Get documents by type
  getByType: async (req, res) => {
    try {
      const { doc_type } = req.params;
      const documents = await GeneratedDocumentsModel.getByType(doc_type);

      return res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Error fetching documents by type:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch documents",
      });
    }
  },

  // Delete document
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await GeneratedDocumentsModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
        });
      }

      return res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete document",
      });
    }
  },

  // Get statistics
  getStatistics: async (req, res) => {
    try {
      const stats = await GeneratedDocumentsModel.getStatistics();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
      });
    }
  },
};

module.exports = GeneratedDocumentsController;
