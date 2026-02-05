// models/integrationsModel.js
const { query } = require("../config/db");

/**
 * Helper function to safely parse config
 * Handles both string and object types from MySQL
 */
function safeParseConfig(config) {
  // If config is already an object, return it as is
  if (typeof config === 'object' && config !== null) {
    return config;
  }
  
  // If config is a string, try to parse it
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch (error) {
      console.error('Failed to parse config string:', error);
      return {};
    }
  }
  
  // Default to empty object for any other type
  return {};
}

/**
 * Create or update integration
 */
async function upsertIntegration(data) {
  const { type, enabled, config } = data;

  return await query(
    `
    INSERT INTO integrations (type, enabled, config)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      enabled = VALUES(enabled),
      config = VALUES(config),
      updated_at = CURRENT_TIMESTAMP
    `,
    [type, enabled, JSON.stringify(config)]
  );
}

/**
 * Get integration by type
 */
async function findIntegrationByType(type) {
  const data = await query(
    `SELECT * FROM integrations WHERE type = ?`,
    [type]
  );
  
  if (data[0]) {
    // Use safe parse helper
    data[0].config = safeParseConfig(data[0].config);
  }
  
  return data[0];
}

/**
 * Get all integrations
 */
async function findAllIntegrations() {
  try {
    const data = await query(
      `SELECT * FROM integrations ORDER BY created_at DESC`
    );
    
    // If no data, return empty array
    if (!data || data.length === 0) {
      return [];
    }
    
    // Use safe parse helper for each row
    return data.map(row => ({
      ...row,
      config: safeParseConfig(row.config)
    }));
  } catch (error) {
    console.error('Error in findAllIntegrations:', error);
    return [];
  }
}

/**
 * Toggle integration status
 */
async function toggleIntegration(type, enabled) {
  return await query(
    `UPDATE integrations SET enabled = ? WHERE type = ?`,
    [enabled, type]
  );
}

/**
 * Delete integration
 */
async function deleteIntegration(type) {
  return await query(
    `DELETE FROM integrations WHERE type = ?`,
    [type]
  );
}

/**
 * Get enabled integration by type (for sending messages)
 */
async function getEnabledIntegration(type) {
  const data = await query(
    `SELECT * FROM integrations WHERE type = ? AND enabled = true`,
    [type]
  );
  
  if (data[0]) {
    // Use safe parse helper
    data[0].config = safeParseConfig(data[0].config);
  }
  
  return data[0];
}

module.exports = {
  upsertIntegration,
  findIntegrationByType,
  findAllIntegrations,
  toggleIntegration,
  deleteIntegration,
  getEnabledIntegration,
};