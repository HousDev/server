// routes/integrationsRoute.js
const express = require("express");
const IntegrationsRouter = express.Router();

const {
  saveIntegration,
  getAllIntegrations,
  getIntegrationByType,
  toggleIntegration,
  deleteIntegration,
} = require("../controllers/integrationsController");

/**
 * Integrations routes
 */

// Save/Update integration configuration
IntegrationsRouter.post("/", saveIntegration);

// Get all integrations
IntegrationsRouter.get("/", getAllIntegrations);

// Get integration by type (smtp, sms, whatsapp)
IntegrationsRouter.get("/:type", getIntegrationByType);

// Toggle integration ON/OFF
IntegrationsRouter.patch("/:type/toggle", toggleIntegration);

// Delete integration
IntegrationsRouter.delete("/:type", deleteIntegration);

module.exports = IntegrationsRouter;