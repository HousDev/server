// controllers/integrationsController.js
const integrationsModel = require("../models/integrationsModel");

/**
 * Save or update integration configuration
 */
async function saveIntegration(req, res) {
  try {
    const { type, enabled, config } = req.body;

    // Validate type
    const validTypes = ['smtp', 'sms', 'whatsapp'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration type. Must be: smtp, sms, or whatsapp"
      });
    }

    // Validate config based on type
    const validation = validateConfig(type, config);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    await integrationsModel.upsertIntegration({
      type,
      enabled: enabled !== undefined ? enabled : false,
      config
    });

    return res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} integration saved successfully`
    });
  } catch (error) {
    console.error("Save Integration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

/**
 * Get all integrations
 */
async function getAllIntegrations(req, res) {
  try {
    const integrations = await integrationsModel.findAllIntegrations();

    return res.status(200).json({
      success: true,
      data: integrations
    });
  } catch (error) {
    console.error("Get All Integrations Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

/**
 * Get integration by type
 */
async function getIntegrationByType(req, res) {
  try {
    const { type } = req.params;

    const integration = await integrationsModel.findIntegrationByType(type);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: `${type.toUpperCase()} integration not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error("Get Integration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

/**
 * Toggle integration ON/OFF
 */
async function toggleIntegration(req, res) {
  try {
    const { type } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: "enabled field is required"
      });
    }

    await integrationsModel.toggleIntegration(type, enabled);

    return res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} integration ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error("Toggle Integration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

/**
 * Delete integration
 */
async function deleteIntegration(req, res) {
  try {
    const { type } = req.params;

    await integrationsModel.deleteIntegration(type);

    return res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} integration deleted successfully`
    });
  } catch (error) {
    console.error("Delete Integration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

/**
 * Validate integration config based on type
 */
function validateConfig(type, config) {
  switch (type) {
    case 'smtp':
      if (!config.host || !config.port || !config.username || !config.password || !config.fromEmail) {
        return { valid: false, message: "SMTP requires: host, port, username, password, fromEmail" };
      }
      break;
    
    case 'sms':
      if (!config.smsProvider || !config.accountSid || !config.authToken || !config.fromNumber) {
        return { valid: false, message: "SMS requires: smsProvider, accountSid, authToken, fromNumber" };
      }
      break;
    
    case 'whatsapp':
      if (!config.phoneNumberId || !config.accessToken || !config.businessAccountId) {
        return { valid: false, message: "WhatsApp requires: phoneNumberId, accessToken, businessAccountId" };
      }
      break;
    
    default:
      return { valid: false, message: "Unknown integration type" };
  }
  
  return { valid: true };
}

module.exports = {
  saveIntegration,
  getAllIntegrations,
  getIntegrationByType,
  toggleIntegration,
  deleteIntegration,
};