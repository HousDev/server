const SettingsModel = require("../models/settingsModel");
const path = require("path");
const fs = require("fs").promises;

class SettingsController {
  // ─── HELPER: Create upload directory if it doesn't exist ─────────────────
  async _ensureUploadDir() {
    const uploadDir = path.join(__dirname, "..", "uploads");

    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`✅ Created upload directory: ${uploadDir}`);
    }
  }

  // ─── HELPER: safely pull userId from decoded JWT ───────────────────────────
  _userId(req) {
    if (!this._loggedOnce) {
      console.log("🔍 req.user shape:", JSON.stringify(req.user));
      this._loggedOnce = true;
    }

    return (
      req.user.sub ||
      req.user.id ||
      req.user.userId ||
      req.user.user_id ||
      req.user.ID ||
      null
    );
  }

  // ─── HELPER: Extract filename from URL or path ───────────────────────────
  _extractFilename(filePath) {
    if (!filePath) return null;
    // Handle both URL and path formats
    return filePath.split("/").pop().split("\\").pop();
  }

  // ─── HELPER: Delete file from uploads folder ────────────────────────────
  async _deleteFile(filename) {
    if (!filename) return;

    try {
      const filePath = path.join(__dirname, "..", "uploads", filename);
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    } catch (err) {
      // File might not exist, that's okay
      console.log(`⚠️ Could not delete file: ${err.message}`);
    }
  }

  // ─── GET PROFILE ──────────────────────────────────────────────────────────
  getProfile = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User ID not found in token. Check authMiddleware.",
        });
      }

      const user = await SettingsModel.getUserById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Build full URL for avatar if it exists
      if (user.avatar) {
        const filename = this._extractFilename(user.avatar);
        user.avatar = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${filename}`;
      }

      return res.json({ success: true, data: user });
    } catch (error) {
      console.error("❌ getProfile error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to get profile" });
    }
  };

  // ─── UPDATE PROFILE (name only) ───────────────────────────────────────────
  updateProfile = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User ID not found in token" });
      }

      const { full_name } = req.body;

      if (!full_name || full_name.trim() === "") {
        return res
          .status(400)
          .json({ success: false, message: "Full name is required" });
      }

      const updated = await SettingsModel.updateProfile(userId, {
        full_name: full_name.trim(),
      });

      // Build full URL for avatar if it exists
      if (updated.avatar) {
        const filename = this._extractFilename(updated.avatar);
        updated.avatar = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${filename}`;
      }

      return res.json({
        success: true,
        data: updated,
        message: "Profile updated successfully",
      });
    } catch (error) {
      console.error("❌ updateProfile error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update profile" });
    }
  };

  // ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
  uploadAvatar = async (req, res) => {
    try {
      await this._ensureUploadDir();
      const userId = this._userId(req);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User ID not found in token" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image uploaded" });
      }

      // Get current user to delete old avatar
      const currentUser = await SettingsModel.getUserById(userId);
      if (currentUser && currentUser.avatar) {
        const oldFilename = this._extractFilename(currentUser.avatar);
        await this._deleteFile(oldFilename);
      }

      // Save filename to database
      await SettingsModel.updateAvatar(userId, req.file.filename);

      // Return full URL
      const avatarUrl = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${req.file.filename}`;

      return res.json({
        success: true,
        data: { avatar: avatarUrl },
        message: "Avatar updated",
      });
    } catch (error) {
      console.error("❌ uploadAvatar error:", error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      }
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload avatar" });
    }
  };

  // ─── REMOVE AVATAR ────────────────────────────────────────────────────────
  removeAvatar = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User ID not found in token" });
      }

      // Get current user to delete file
      const currentUser = await SettingsModel.getUserById(userId);
      if (currentUser && currentUser.avatar) {
        const filename = this._extractFilename(currentUser.avatar);
        await this._deleteFile(filename);
      }

      // Remove avatar from database
      await SettingsModel.removeAvatar(userId);

      return res.json({
        success: true,
        data: { avatar: null },
        message: "Avatar removed",
      });
    } catch (error) {
      console.error("❌ removeAvatar error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to remove avatar" });
    }
  };

  // ─── GET NOTIFICATION PREFERENCES ────────────────────────────────────────
  getNotificationPrefs = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User ID not found in token" });
      }

      const prefs = await SettingsModel.getNotificationPreferences(userId);
      return res.json({ success: true, data: prefs });
    } catch (error) {
      console.error("❌ getNotificationPrefs error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to get preferences" });
    }
  };

  // ─── UPDATE NOTIFICATION PREFERENCES ─────────────────────────────────────
  updateNotificationPrefs = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User ID not found in token" });
      }

      const { email, sms, push, whatsapp } = req.body;

      const preferences = {
        email: !!email,
        sms: !!sms,
        push: !!push,
        whatsapp: !!whatsapp,
      };

      await SettingsModel.updateNotificationPreferences(userId, preferences);

      return res.json({
        success: true,
        data: preferences,
        message: "Preferences saved",
      });
    } catch (error) {
      console.error("❌ updateNotificationPrefs error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save preferences" });
    }
  };

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
  changePassword = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User ID not found in token" });
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: "current_password and new_password are required",
        });
      }

      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 8 characters",
        });
      }

      // Verify current password FIRST
      const isMatch = await SettingsModel.verifyPassword(
        userId,
        current_password,
      );
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Save new password
      await SettingsModel.saveNewPassword(userId, new_password);

      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("❌ changePassword error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to change password" });
    }
  };

  // ─── GET SYSTEM SETTINGS (admin) ──────────────────────────────────────────
  getSystemSettings = async (req, res) => {
    try {
      const settings = await SettingsModel.getSystemSettings();

      // Build full URLs for logo and favicon
      if (settings.logo) {
        const logoFilename = this._extractFilename(settings.logo);
        settings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${logoFilename}`;
      }
      if (settings.favicon) {
        const faviconFilename = this._extractFilename(settings.favicon);
        settings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${faviconFilename}`;
      }

      return res.json({ success: true, data: settings });
    } catch (error) {
      console.error("❌ getSystemSettings error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to get system settings" });
    }
  };

  // ─── UPDATE SYSTEM SETTINGS (admin) ───────────────────────────────────────
  updateSystemSettings = async (req, res) => {
    try {
      const { theme, primaryColor, timezone, dateFormat, language } = req.body;

      const current = await SettingsModel.getSystemSettings();

      const merged = {
        ...current,
        ...(theme !== undefined && { theme }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(timezone !== undefined && { timezone }),
        ...(dateFormat !== undefined && { dateFormat }),
        ...(language !== undefined && { language }),
      };

      // Extract only filenames for storage
      if (merged.logo && merged.logo.includes("/")) {
        merged.logo = this._extractFilename(merged.logo);
      }
      if (merged.favicon && merged.favicon.includes("/")) {
        merged.favicon = this._extractFilename(merged.favicon);
      }

      await SettingsModel.updateSystemSettings(merged);

      // Get updated settings and build full URLs
      const finalSettings = await SettingsModel.getSystemSettings();

      if (finalSettings.logo) {
        const logoFilename = this._extractFilename(finalSettings.logo);
        finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${logoFilename}`;
      }
      if (finalSettings.favicon) {
        const faviconFilename = this._extractFilename(finalSettings.favicon);
        finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${faviconFilename}`;
      }

      return res.json({
        success: true,
        data: finalSettings,
        message: "System settings saved",
      });
    } catch (error) {
      console.error("❌ updateSystemSettings error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update settings" });
    }
  };

  // ─── UPLOAD LOGO (admin) ──────────────────────────────────────────────────
  uploadLogo = async (req, res) => {
    try {
      await this._ensureUploadDir();

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      // Get current settings to delete old logo
      const current = await SettingsModel.getSystemSettings();
      if (current.logo) {
        const oldFilename = this._extractFilename(current.logo);
        await this._deleteFile(oldFilename);
      }

      // Save filename to database
      await SettingsModel.updateLogo(req.file.filename);

      // Get updated settings and build full URL
      const finalSettings = await SettingsModel.getSystemSettings();

      if (finalSettings.logo) {
        const logoFilename = this._extractFilename(finalSettings.logo);
        finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${logoFilename}`;
      }
      if (finalSettings.favicon) {
        const faviconFilename = this._extractFilename(finalSettings.favicon);
        finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${faviconFilename}`;
      }

      return res.json({
        success: true,
        data: finalSettings,
        message: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error("❌ uploadLogo error:", error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      }
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload logo" });
    }
  };

  // ─── REMOVE LOGO (admin) ──────────────────────────────────────────────────
  removeLogo = async (req, res) => {
    try {
      const current = await SettingsModel.getSystemSettings();

      // Delete logo file
      if (current.logo) {
        const filename = this._extractFilename(current.logo);
        await this._deleteFile(filename);
      }

      // Remove logo from database
      const updated = await SettingsModel.removeLogo();

      // Build full URLs
      if (updated.logo) {
        const logoFilename = this._extractFilename(updated.logo);
        updated.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${logoFilename}`;
      }
      if (updated.favicon) {
        const faviconFilename = this._extractFilename(updated.favicon);
        updated.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${faviconFilename}`;
      }

      return res.json({
        success: true,
        data: updated,
        message: "Logo removed successfully",
      });
    } catch (error) {
      console.error("❌ removeLogo error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to remove logo" });
    }
  };

  // ─── UPLOAD FAVICON (admin) ───────────────────────────────────────────────
  uploadFavicon = async (req, res) => {
    try {
      await this._ensureUploadDir();

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      // Get current settings to delete old favicon
      const current = await SettingsModel.getSystemSettings();
      if (current.favicon) {
        const oldFilename = this._extractFilename(current.favicon);
        await this._deleteFile(oldFilename);
      }

      // Save filename to database
      await SettingsModel.updateFavicon(req.file.filename);

      // Get updated settings and build full URL
      const finalSettings = await SettingsModel.getSystemSettings();

      if (finalSettings.logo) {
        const logoFilename = this._extractFilename(finalSettings.logo);
        finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${logoFilename}`;
      }
      if (finalSettings.favicon) {
        const faviconFilename = this._extractFilename(finalSettings.favicon);
        finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${faviconFilename}`;
      }

      return res.json({
        success: true,
        data: finalSettings,
        message: "Favicon uploaded successfully",
      });
    } catch (error) {
      console.error("❌ uploadFavicon error:", error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      }
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload favicon" });
    }
  };

  // ─── REMOVE FAVICON (admin) ───────────────────────────────────────────────
  removeFavicon = async (req, res) => {
    try {
      const current = await SettingsModel.getSystemSettings();

      // Delete favicon file
      if (current.favicon) {
        const filename = this._extractFilename(current.favicon);
        await this._deleteFile(filename);
      }

      // Remove favicon from database
      const updated = await SettingsModel.removeFavicon();

      // Build full URLs
      if (updated.logo) {
        const logoFilename = this._extractFilename(updated.logo);
        updated.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${logoFilename}`;
      }
      if (updated.favicon) {
        const faviconFilename = this._extractFilename(updated.favicon);
        updated.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/${faviconFilename}`;
      }

      return res.json({
        success: true,
        data: updated,
        message: "Favicon removed successfully",
      });
    } catch (error) {
      console.error("❌ removeFavicon error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to remove favicon" });
    }
  };
}

module.exports = new SettingsController();
