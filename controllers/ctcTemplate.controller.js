const { query } = require("../config/db");
const CTCTemplateModel = require("../models/ctcTemplate.model");

const CTCTemplateController = {
  // =====================================================
  // CREATE TEMPLATE
  // =====================================================
  createTemplate: async (req, res) => {
    console.log(req.body);
    try {
      const { name, description, is_default, components } = req.body;

      if (!name) {
        return res.status(400).json({
          message: "Template name is required",
        });
      }

      if (
        !components ||
        !Array.isArray(components) ||
        components.length === 0
      ) {
        return res.status(400).json({
          message: "At least one component is required",
        });
      }

      const templateId = await CTCTemplateModel.createTemplate({
        name,
        description,
        is_default,
        components,
      });

      return res.status(201).json({
        message: "CTC template created successfully",
        template_id: templateId,
        success: true,
      });
    } catch (error) {
      console.error("Create Template Error:", error);
      return res.status(500).json({
        message: "Failed to create template",
      });
    }
  },

  // =====================================================
  // UPDATE TEMPLATE
  // =====================================================
  updateTemplate: async (req, res) => {
    try {
      console.log(req.body);
      const { template_id } = req.params;
      const { name, description, is_active, components } = req.body;

      if (!template_id) {
        return res.status(400).json({
          message: "Template ID is required",
        });
      }

      if (!name) {
        return res.status(400).json({
          message: "Template name is required",
        });
      }

      if (!components || !Array.isArray(components)) {
        return res.status(400).json({
          message: "Components array is required",
        });
      }

      await CTCTemplateModel.updateTemplate(template_id, {
        name,
        description,
        is_active,
        components,
      });

      return res.status(200).json({
        message: "Template updated successfully",
      });
    } catch (error) {
      console.error("Update Template Error:", error);
      return res.status(500).json({
        message: "Failed to update template",
      });
    }
  },

  // =====================================================
  // GET SINGLE TEMPLATE
  // =====================================================
  getTemplate: async (req, res) => {
    try {
      const { template_id } = req.params;

      if (!template_id) {
        return res.status(400).json({
          message: "Template ID is required",
        });
      }

      const template = await CTCTemplateModel.getTemplate(template_id);

      if (!template) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({
        data: template,
      });
    } catch (error) {
      console.error("Get Template Error:", error);
      return res.status(500).json({
        message: "Failed to fetch template",
      });
    }
  },

  // =====================================================
  // GET ALL TEMPLATES
  // =====================================================
  getAllTemplates: async (req, res) => {
    try {
      const templates = await CTCTemplateModel.getAllTemplates();

      return res.status(200).json({
        data: templates,
      });
    } catch (error) {
      console.error("Get All Templates Error:", error);
      return res.status(500).json({
        message: "Failed to fetch templates",
      });
    }
  },

  setDefaultTemplate: async (req, res) => {
    try {
      const { template_id } = req.params;

      await query(
        "UPDATE ctc_templates SET is_default = 0 WHERE is_default = 1",
      );

      const updateTemplate = await query(
        "UPDATE ctc_templates SET is_default = 1 WHERE id = ?",
        [template_id],
      );

      return res.status(200).json({
        message: "Template set to default.",
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal Server Error.",
      });
    }
  },

  toggleActiveTemplate: async (req, res) => {
    try {
      const { template_id } = req.params;

      const updateTemplate = await query(
        `UPDATE ctc_templates 
SET is_active = NOT is_active 
WHERE id = ?`,
        [template_id],
      );

      return res.status(200).json({
        message: "Template updated successfully.",
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal Server Error.",
      });
    }
  },

  // =====================================================
  // DELETE TEMPLATE
  // =====================================================
  deleteTemplate: async (req, res) => {
    try {
      const { template_id } = req.params;

      if (!template_id) {
        return res.status(400).json({
          message: "Template ID is required",
        });
      }

      await CTCTemplateModel.deleteTemplate(template_id);

      return res.status(200).json({
        message: "Template deleted successfully",
        success: true,
      });
    } catch (error) {
      console.error("Delete Template Error:", error);
      return res.status(500).json({
        message: "Failed to delete template",
      });
    }
  },
};

module.exports = CTCTemplateController;
