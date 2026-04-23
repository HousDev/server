const express = require("express");
const documentTemplateRouter = express.Router();
const DocumentTemplateController = require("../controllers/documentTemplates.controller");
const upload = require("../middleware/upload");

// Middleware to handle JSON errors
const handleJsonErrors = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }
  next();
};

documentTemplateRouter.use(handleJsonErrors);

// ============================================
// CREATE TEMPLATE (WITH FILE UPLOAD)
// ============================================
documentTemplateRouter.post(
  "/",
  upload.single("logo_url"), // multer middleware (same pattern as Leave)
  DocumentTemplateController.createTemplate,
);

// ============================================
// GET ALL TEMPLATES
// ============================================
documentTemplateRouter.get("/", DocumentTemplateController.getAll);

// ============================================
// GET TEMPLATE BY ID
// ============================================

documentTemplateRouter.get("/:id", DocumentTemplateController.getById);

// ============================================
// UPDATE TEMPLATE (WITH FILE UPLOAD)
// ============================================
documentTemplateRouter.put(
  "/active-inactive/:id",
  DocumentTemplateController.activeInactiveTemplate,
);
documentTemplateRouter.put(
  "/approve/:id",
  DocumentTemplateController.approveDocumentTemplate,
);
documentTemplateRouter.put(
  "/reject/:id",
  DocumentTemplateController.rejectDocumentTemplate,
);
documentTemplateRouter.put(
  "/:id",
  upload.single("logo_url"),
  DocumentTemplateController.updateTemplate,
);

// ============================================
// DELETE TEMPLATE (SOFT DELETE)
// ============================================
documentTemplateRouter.delete(
  "/:id",
  DocumentTemplateController.deleteTemplate,
);

module.exports = documentTemplateRouter;
