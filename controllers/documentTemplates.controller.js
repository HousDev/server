const DocumentTemplateModel = require("../models/documentTemplates.model");

const DocumentTemplateController = {
  // ============================================
  // CREATE
  // ============================================
  createTemplate: async (req, res) => {
    try {
      let { name, category, description, html_content, variables, logo_url } =
        req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      if (!html_content) {
        return res.status(400).json({ message: "HTML content is required" });
      }

      // =========================
      // FILE (MULTER)
      // =========================

      if (req.file) {
        logo_url = req.file.filename; // or full path
      }
      const id = await DocumentTemplateModel.createTemplate({
        name,
        category,
        description,
        html_content,
        variables: variables ? JSON.parse(variables) : [],
        logo_url,
      });

      return res.status(201).json({
        message: "Template created successfully",
        id,
        logo_url,
        success: true,
      });
    } catch (error) {
      console.error("Create Template Error:", error);

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File size must be less than limit",
        });
      }

      return res.status(500).json({
        message: "Failed to create template",
      });
    }
  },

  // ============================================
  // GET ALL
  // ============================================
  getAll: async (req, res) => {
    try {
      const data = await DocumentTemplateModel.getAll();

      return res.status(200).json({
        message: "Templates fetched",
        data,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch templates",
      });
    }
  },

  // ============================================
  // GET BY ID
  // ============================================
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const data = await DocumentTemplateModel.getById(id);

      if (!data) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch template",
      });
    }
  },

  approveDocumentTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by, approved_at } = req.body;
      const data = await DocumentTemplateModel.approveTemplate(id, {
        approved_by,
        approved_at,
      });

      if (!data) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({ data, success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch template",
      });
    }
  },

  activeInactiveTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const data = await DocumentTemplateModel.activeInactiveTemplateModel(
        id,
        is_active,
      );

      if (!data) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({ data, success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch template",
      });
    }
  },

  // ============================================
  // UPDATE
  // ============================================
  updateTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        category,
        description,
        html_content,
        variables,
        existing_logo_url,
      } = req.body;

      // Initialize logo_url - if existing_logo_url is provided, use it
      let logo_url = existing_logo_url || null;

      // Check if new file was uploaded
      if (req.file) {
        logo_url = req.file.filename;
      }

      const updated = await DocumentTemplateModel.updateTemplate(id, {
        name,
        category,
        description,
        html_content,
        variables: variables ? JSON.parse(variables) : [],
        logo_url,
      });

      if (!updated) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({
        message: "Template updated successfully",
        success: true,
      });
    } catch (error) {
      console.error("Update Template Error:", error);
      return res.status(500).json({
        message: "Failed to update template",
        error: error.message,
      });
    }
  },

  rejectDocumentTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      const { approved_by, approved_at, rejection_reason } = req.body;
      const updated = await DocumentTemplateModel.rejectDocumentTemplateModel(
        id,
        {
          approved_by,
          approved_at,
          rejection_reason,
        },
      );

      if (!updated) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({
        message: "Template updated successfully",
        success: true,
      });
    } catch (error) {
      console.error("Update Template Error:", error);
      return res.status(500).json({
        message: "Failed to update template",
        error: error.message,
      });
    }
  },

  // ============================================
  // DELETE
  // ============================================
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await DocumentTemplateModel.deleteTemplate(id);

      if (!deleted) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({
        message: "Template deleted",
        success: true,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to delete template",
      });
    }
  },
};

module.exports = DocumentTemplateController;
