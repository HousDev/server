const { query } = require("../config/db");
const bcrypt = require("bcryptjs");

// ─── AUTO-DETECT avatar column (runs once, caches result) ───────────────────
let _avatarColumn = null;

async function getAvatarColumn() {
  if (_avatarColumn) return _avatarColumn;

  const columns = await query(`SHOW COLUMNS FROM users`);
  const colNames = columns.map((c) => c.Field.toLowerCase());
  console.log("👀 users table columns:", colNames);

  const candidates = [
    "profile_picture",
    "profile_pic",
    "avatar",
    "photo",
    "image",
    "user_image",
    "profile_image",
  ];

  for (const name of candidates) {
    if (colNames.includes(name)) {
      _avatarColumn = name;
      console.log("✅ Avatar column auto-detected:", _avatarColumn);
      return _avatarColumn;
    }
  }

  _avatarColumn = "profile_picture";
  console.warn("⚠️  No known avatar column found. Columns:", colNames);
  return _avatarColumn;
}

class SettingsModel {
  // ─── GET USER BY ID ───────────────────────────────────────────────────────
  static async getUserById(userId) {
    const col = await getAvatarColumn();

    const rows = await query(
      `SELECT 
        id, full_name, email, phone, role, 
        ${col} AS avatar,
        department, department_id,
        is_active, created_at, updated_at
       FROM users 
       WHERE id = ? 
       LIMIT 1`,
      [userId]
    );
    
    const user = rows[0] || null;
    
    if (user && user.avatar) {
      // If it's already a full URL, return as-is
      if (user.avatar.startsWith('http')) {
        return user;
      }
      
      // If it's just a filename, prepend the full URL
      const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
      user.avatar = `${BASE_URL}/api/uploads/avatars/${user.avatar}`;
    }
    
    return user;
  }

  // ─── UPDATE PROFILE (only full_name) ─────────────────────────────────────
  static async updateProfile(userId, { full_name }) {
    await query(
      `UPDATE users SET full_name = ?, updated_at = NOW() WHERE id = ?`,
      [full_name, userId]
    );
    return await this.getUserById(userId);
  }

  // ─── UPDATE AVATAR ────────────────────────────────────────────────────────
  static async updateAvatar(userId, avatarPath) {
    const col = await getAvatarColumn();

    await query(
      `UPDATE users SET ${col} = ?, updated_at = NOW() WHERE id = ?`,
      [avatarPath, userId]
    );
    return await this.getUserById(userId);
  }

  // ─── REMOVE AVATAR ────────────────────────────────────────────────────────
  static async removeAvatar(userId) {
    const col = await getAvatarColumn();

    await query(
      `UPDATE users SET ${col} = NULL, updated_at = NOW() WHERE id = ?`,
      [userId]
    );
    return await this.getUserById(userId);
  }

  // ─── GET NOTIFICATION PREFERENCES ────────────────────────────────────────
  static async getNotificationPreferences(userId) {
    const rows = await query(
      `SELECT preferences FROM user_notification_preferences WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (rows.length > 0 && rows[0].preferences) {
      try {
        return JSON.parse(rows[0].preferences);
      } catch (e) {
        return this.defaultNotificationPrefs();
      }
    }

    return this.defaultNotificationPrefs();
  }

  // ─── UPSERT NOTIFICATION PREFERENCES ─────────────────────────────────────
  static async updateNotificationPreferences(userId, preferences) {
    const prefsJson = JSON.stringify(preferences);

    const existing = await query(
      `SELECT id FROM user_notification_preferences WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE user_notification_preferences 
         SET preferences = ?, updated_at = NOW() 
         WHERE user_id = ?`,
        [prefsJson, userId]
      );
    } else {
      await query(
        `INSERT INTO user_notification_preferences (user_id, preferences) 
         VALUES (?, ?)`,
        [userId, prefsJson]
      );
    }

    return preferences;
  }

  // ─── VERIFY CURRENT PASSWORD ─────────────────────────────────────────────
  static async verifyPassword(userId, plainPassword) {
    const rows = await query(
      `SELECT password FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!rows[0]) return false;
    return await bcrypt.compare(plainPassword, rows[0].password);
  }

  // ─── HASH & SAVE NEW PASSWORD ─────────────────────────────────────────────
  static async saveNewPassword(userId, plainPassword) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    await query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashed, userId]
    );
    return true;
  }

  // ─── GET SYSTEM SETTINGS (singleton row id = 1) ─────────────────────────
 static async getSystemSettings() {
    const rows = await query(
      `SELECT settings_json, logo_file, favicon_file 
       FROM system_settings 
       WHERE id = 1 
       LIMIT 1`
    );

    if (rows.length > 0) {
      let settings = {};
      const raw = rows[0].settings_json;

      // MySQL JSON columns auto-parse, so it might already be an object
      if (typeof raw === 'object' && raw !== null) {
        settings = raw;
      } else if (typeof raw === 'string') {
        try {
          settings = JSON.parse(raw);
        } catch (e) {
          console.error("Error parsing settings JSON, using defaults:", e);
          settings = {};
        }
      }

      settings.logo = rows[0].logo_file || null;
      settings.favicon = rows[0].favicon_file || null;

      return { ...this.defaultSystemSettings(), ...settings };
    }

    return this.defaultSystemSettings();
  }

  // ─── UPSERT SYSTEM SETTINGS ──────────────────────────────────────────────
  static async updateSystemSettings(settings) {
    // Extract logo and favicon from settings (they might be full URLs or filenames)
    let logo = settings.logo;
    let favicon = settings.favicon;
    
    // If they're full URLs, extract just the filename
    if (logo && logo.includes('/')) {
      logo = logo.split('/').pop();
    }
    if (favicon && favicon.includes('/')) {
      favicon = favicon.split('/').pop();
    }
    
    // Remove logo and favicon from JSON settings since they're in separate columns
    // Remove logo and favicon from JSON settings since they're in separate columns
    const { logo: _, favicon: __, ...jsonSettings } = settings;
    // Ensure we always store a proper JSON string, never "[object Object]"
    const json = typeof jsonSettings === 'string' ? jsonSettings : JSON.stringify(jsonSettings);

    const existing = await query(`SELECT id FROM system_settings WHERE id = 1`);

    if (existing.length > 0) {
      await query(
        `UPDATE system_settings 
         SET settings_json = ?, 
             updated_at = NOW(),
             logo_file = ?,
             favicon_file = ?
         WHERE id = 1`,
        [json, logo, favicon]
      );
    } else {
      await query(
        `INSERT INTO system_settings (id, settings_json, logo_file, favicon_file) 
         VALUES (1, ?, ?, ?)`,
        [json, logo, favicon]
      );
    }

    return await this.getSystemSettings();
  }

  // ─── UPDATE ONLY LOGO ──────────────────────────────────────────────────
  static async updateLogo(logoFilename) {
    const existing = await query(`SELECT id FROM system_settings WHERE id = 1`);
    
    if (existing.length > 0) {
      await query(
        `UPDATE system_settings 
         SET logo_file = ?, updated_at = NOW() 
         WHERE id = 1`,
        [logoFilename]
      );
    } else {
      // Create new record if doesn't exist
      const defaultSettings = JSON.stringify(this.defaultSystemSettings());
      await query(
        `INSERT INTO system_settings (id, settings_json, logo_file) 
         VALUES (1, ?, ?)`,
        [defaultSettings, logoFilename]
      );
    }
    
    return await this.getSystemSettings();
  }

  // ─── UPDATE ONLY FAVICON ───────────────────────────────────────────────
  static async updateFavicon(faviconFilename) {
    const existing = await query(`SELECT id FROM system_settings WHERE id = 1`);
    
    if (existing.length > 0) {
      await query(
        `UPDATE system_settings 
         SET favicon_file = ?, updated_at = NOW() 
         WHERE id = 1`,
        [faviconFilename]
      );
    } else {
      // Create new record if doesn't exist
      const defaultSettings = JSON.stringify(this.defaultSystemSettings());
      await query(
        `INSERT INTO system_settings (id, settings_json, favicon_file) 
         VALUES (1, ?, ?)`,
        [defaultSettings, faviconFilename]
      );
    }
    
    return await this.getSystemSettings();
  }

  // ─── REMOVE LOGO ──────────────────────────────────────────────────────
  static async removeLogo() {
    await query(
      `UPDATE system_settings 
       SET logo_file = NULL, updated_at = NOW() 
       WHERE id = 1`
    );
    return await this.getSystemSettings();
  }

  // ─── REMOVE FAVICON ───────────────────────────────────────────────────
  static async removeFavicon() {
    await query(
      `UPDATE system_settings 
       SET favicon_file = NULL, updated_at = NOW() 
       WHERE id = 1`
    );
    return await this.getSystemSettings();
  }

  // ─── DEFAULTS ─────────────────────────────────────────────────────────────
  static defaultNotificationPrefs() {
    return { email: true, sms: false, push: true, whatsapp: false };
  }

  static defaultSystemSettings() {
    return {
      theme: "light",
      primaryColor: "#C62828",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      language: "en",
    };
  }
}

module.exports = SettingsModel;