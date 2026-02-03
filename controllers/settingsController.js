// // controllers/settingsController.js
// const SettingsModel = require("../models/settingsModel");
// const path = require("path");
// const fs = require("fs").promises;

// class SettingsController {
//   // ─── HELPER: Create upload directories if they don't exist ─────────────────
//   async _ensureUploadDirs() {
//     const dirs = [
//       path.join(__dirname, "..", "uploads", "avatars"),
//       path.join(__dirname, "..", "uploads", "logos"),
//       path.join(__dirname, "..", "uploads", "favicons"),
//     ];

//     for (const dir of dirs) {
//       try {
//         await fs.access(dir);
//       } catch {
//         await fs.mkdir(dir, { recursive: true });
//         console.log(`✅ Created directory: ${dir}`);
//       }
//     }
//   }

//   // ─── HELPER: safely pull userId from decoded JWT ───────────────────────────
//   _userId(req) {
//     if (!this._loggedOnce) {
//       console.log("🔍 req.user shape:", JSON.stringify(req.user));
//       this._loggedOnce = true;
//     }

//     return (
//       req.user.sub ||
//       req.user.id ||
//       req.user.userId ||
//       req.user.user_id ||
//       req.user.ID ||
//       null
//     );
//   }

//   // ─── GET PROFILE ──────────────────────────────────────────────────────────
//   getProfile = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: "User ID not found in token. Check authMiddleware.",
//         });
//       }

//       const user = await SettingsModel.getUserById(userId);

//       if (!user) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }

//       // Prepend base URL if avatar is just a filename
//       if (user.avatar && !user.avatar.startsWith("http")) {
//         user.avatar = `${process.env.BASE_URL || "http://localhost:4000"}/uploads/avatars/${user.avatar}`;
//       }

//       return res.json({ success: true, data: user });
//     } catch (error) {
//       console.error("❌ getProfile error:", error);
//       return res.status(500).json({ success: false, message: "Failed to get profile" });
//     }
//   };

//   // ─── UPDATE PROFILE (name only) ───────────────────────────────────────────
//   updateProfile = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const { full_name } = req.body;

//       if (!full_name || full_name.trim() === "") {
//         return res.status(400).json({ success: false, message: "Full name is required" });
//       }

//       const updated = await SettingsModel.updateProfile(userId, {
//         full_name: full_name.trim(),
//       });

//       if (updated.avatar && !updated.avatar.startsWith("http")) {
//         updated.avatar = `${process.env.BASE_URL || "http://localhost:4000"}/uploads/avatars/${updated.avatar}`;
//       }

//       return res.json({
//         success: true,
//         data: updated,
//         message: "Profile updated successfully",
//       });
//     } catch (error) {
//       console.error("❌ updateProfile error:", error);
//       return res.status(500).json({ success: false, message: "Failed to update profile" });
//     }
//   };

//   // ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
// // ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
// // ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
// uploadAvatar = async (req, res) => {
//   try {
//     await this._ensureUploadDirs();
//     const userId = this._userId(req);

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User ID not found in token" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No image uploaded" });
//     }

//     // Delete old avatar
//     const currentUser = await SettingsModel.getUserById(userId);
//     if (currentUser && currentUser.avatar) {
//       const oldFilename = currentUser.avatar.includes("/")
//         ? currentUser.avatar.split("/").pop()
//         : currentUser.avatar;

//       const oldFilePath = path.join(__dirname, "..", "uploads", "avatars", oldFilename);
//       try {
//         await fs.unlink(oldFilePath);
//         console.log(`🗑️ Deleted old avatar: ${oldFilePath}`);
//       } catch (err) {
//         console.log(`⚠️ Could not delete old avatar: ${err.message}`);
//       }
//     }

//     // Move to avatars directory
//     const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");
//     const newFilePath = path.join(avatarsDir, req.file.filename);

//     try {
//       await fs.rename(req.file.path, newFilePath);
//       console.log(`✅ Moved avatar to: ${newFilePath}`);
//     } catch (err) {
//       console.error(`❌ Failed to move file: ${err.message}`);
//       await fs.copyFile(req.file.path, newFilePath);
//       await fs.unlink(req.file.path);
//     }

//     // Save filename to database
//     await SettingsModel.updateAvatar(userId, req.file.filename);

//     // ✅ Return full URL with /api (this is CORRECT for your setup)
//     const avatarUrl = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/avatars/${req.file.filename}`;

//     return res.json({ success: true, data: { avatar: avatarUrl }, message: "Avatar updated" });
//   } catch (error) {
//     console.error("❌ uploadAvatar error:", error);
//     if (req.file) {
//       try {
//         await fs.unlink(req.file.path);
//       } catch (_) {}
//     }
//     return res.status(500).json({ success: false, message: "Failed to upload avatar" });
//   }
// };

//   // ─── REMOVE AVATAR ────────────────────────────────────────────────────────
//   removeAvatar = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const currentUser = await SettingsModel.getUserById(userId);
//       if (currentUser && currentUser.avatar) {
//         const filename = currentUser.avatar.includes("/")
//           ? currentUser.avatar.split("/").pop()
//           : currentUser.avatar;

//         const filePath = path.join(__dirname, "..", "uploads", "avatars", filename);
//         try {
//           await fs.unlink(filePath);
//           console.log(`🗑️ Deleted avatar: ${filePath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete avatar: ${err.message}`);
//         }
//       }

//       await SettingsModel.removeAvatar(userId);

//       return res.json({ success: true, data: { avatar: null }, message: "Avatar removed" });
//     } catch (error) {
//       console.error("❌ removeAvatar error:", error);
//       return res.status(500).json({ success: false, message: "Failed to remove avatar" });
//     }
//   };

//   // ─── GET NOTIFICATION PREFERENCES ────────────────────────────────────────
//   getNotificationPrefs = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const prefs = await SettingsModel.getNotificationPreferences(userId);
//       return res.json({ success: true, data: prefs });
//     } catch (error) {
//       console.error("❌ getNotificationPrefs error:", error);
//       return res.status(500).json({ success: false, message: "Failed to get preferences" });
//     }
//   };

//   // ─── UPDATE NOTIFICATION PREFERENCES ─────────────────────────────────────
//   updateNotificationPrefs = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const { email, sms, push, whatsapp } = req.body;

//       const preferences = {
//         email: !!email,
//         sms: !!sms,
//         push: !!push,
//         whatsapp: !!whatsapp,
//       };

//       await SettingsModel.updateNotificationPreferences(userId, preferences);

//       return res.json({ success: true, data: preferences, message: "Preferences saved" });
//     } catch (error) {
//       console.error("❌ updateNotificationPrefs error:", error);
//       return res.status(500).json({ success: false, message: "Failed to save preferences" });
//     }
//   };

//   // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
//   changePassword = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const { current_password, new_password } = req.body;

//       if (!current_password || !new_password) {
//         return res.status(400).json({
//           success: false,
//           message: "current_password and new_password are required",
//         });
//       }

//       if (new_password.length < 8) {
//         return res.status(400).json({
//           success: false,
//           message: "New password must be at least 8 characters",
//         });
//       }

//       // Verify current password FIRST
//       const isMatch = await SettingsModel.verifyPassword(userId, current_password);
//       if (!isMatch) {
//         return res.status(400).json({
//           success: false,
//           message: "Current password is incorrect",
//         });
//       }

//       // Save new password
//       await SettingsModel.saveNewPassword(userId, new_password);

//       return res.json({ success: true, message: "Password changed successfully" });
//     } catch (error) {
//       console.error("❌ changePassword error:", error);
//       return res.status(500).json({ success: false, message: "Failed to change password" });
//     }
//   };

//   // ─── GET SYSTEM SETTINGS (admin) ──────────────────────────────────────────
//  // ─── GET SYSTEM SETTINGS (admin) ──────────────────────────────────────────
// getSystemSettings = async (req, res) => {
//   try {
//     const settings = await SettingsModel.getSystemSettings();

//     // ✅ FIX: Use /api prefix for consistency
//     if (settings.logo && !settings.logo.startsWith("http")) {
//       settings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${settings.logo}`;
//     }
//     if (settings.favicon && !settings.favicon.startsWith("http")) {
//       settings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${settings.favicon}`;
//     }

//     return res.json({ success: true, data: settings });
//   } catch (error) {
//     console.error("❌ getSystemSettings error:", error);
//     return res.status(500).json({ success: false, message: "Failed to get system settings" });
//   }
// };

//   // ─── UPDATE SYSTEM SETTINGS (admin) ───────────────────────────────────────
//   updateSystemSettings = async (req, res) => {
//     try {
//       const { theme, primaryColor, timezone, dateFormat, language } = req.body;

//       const current = await SettingsModel.getSystemSettings();

//       const merged = {
//         ...current,
//         ...(theme !== undefined && { theme }),
//         ...(primaryColor !== undefined && { primaryColor }),
//         ...(timezone !== undefined && { timezone }),
//         ...(dateFormat !== undefined && { dateFormat }),
//         ...(language !== undefined && { language }),
//       };

//       await SettingsModel.updateSystemSettings(merged);

//       return res.json({ success: true, data: merged, message: "System settings saved" });
//     } catch (error) {
//       console.error("❌ updateSystemSettings error:", error);
//       return res.status(500).json({ success: false, message: "Failed to update settings" });
//     }
//   };

//   // ─── UPLOAD LOGO (admin) ──────────────────────────────────────────────────
//  uploadLogo = async (req, res) => {
//   try {
//     // Ensure logos directory exists
//     await this._ensureUploadDirs();

//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     const current = await SettingsModel.getSystemSettings();

//     // Delete old logo file if one exists
//     if (current.logo) {
//       const oldFilename = current.logo.includes("/")
//         ? current.logo.split("/").pop()
//         : current.logo;

//       const oldPath = path.join(__dirname, "..", "uploads", "logos", oldFilename);
//       try {
//         await fs.unlink(oldPath);
//         console.log(`🗑️ Deleted old logo: ${oldPath}`);
//       } catch (err) {
//         console.log(`⚠️ Could not delete old logo: ${err.message}`);
//       }
//     }

//     // Move uploaded file to logos directory
//     const logosDir = path.join(__dirname, "..", "uploads", "logos");
//     const newFilePath = path.join(logosDir, req.file.filename);

//     try {
//       await fs.rename(req.file.path, newFilePath);
//       console.log(`✅ Moved logo to: ${newFilePath}`);
//     } catch (err) {
//       console.error(`❌ Failed to move file: ${err.message}`);
//       await fs.copyFile(req.file.path, newFilePath);
//       await fs.unlink(req.file.path);
//     }

//     // Save only the filename in database
//     const updated = { ...current, logo: req.file.filename };
//     await SettingsModel.updateSystemSettings(updated);

//     // ✅ FIX: Return full URL with /api prefix (same as avatar)
//     const logoUrl = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${req.file.filename}`;

//     return res.json({ success: false, data: { logo: logoUrl }, message: "Logo uploaded" });
//   } catch (error) {
//     console.error("❌ uploadLogo error:", error);
//     if (req.file) {
//       try {
//         await fs.unlink(req.file.path);
//       } catch (_) {}
//     }
//     return res.status(500).json({ success: false, message: "Failed to upload logo" });
//   }
// };


//   // ─── REMOVE LOGO (admin) ──────────────────────────────────────────────────
//   removeLogo = async (req, res) => {
//     try {
//       const current = await SettingsModel.getSystemSettings();

//       if (current.logo) {
//         const filename = current.logo.includes("/")
//           ? current.logo.split("/").pop()
//           : current.logo;

//         const oldPath = path.join(__dirname, "..", "uploads", "logos", filename);
//         try {
//           await fs.unlink(oldPath);
//           console.log(`🗑️ Deleted logo: ${oldPath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete logo: ${err.message}`);
//         }
//       }

//       const updated = { ...current, logo: null };
//       await SettingsModel.updateSystemSettings(updated);

//       return res.json({ success: true, data: { logo: null }, message: "Logo removed" });
//     } catch (error) {
//       console.error("❌ removeLogo error:", error);
//       return res.status(500).json({ success: false, message: "Failed to remove logo" });
//     }
//   };

//   // ─── UPLOAD FAVICON (admin) ───────────────────────────────────────────────
//   uploadFavicon = async (req, res) => {
//   try {
//     // Ensure favicons directory exists
//     await this._ensureUploadDirs();

//     if (!req.file) {
//       return res.status(400).json({ success: false, message: "No file uploaded" });
//     }

//     const current = await SettingsModel.getSystemSettings();

//     // Delete old favicon file if one exists
//     if (current.favicon) {
//       const oldFilename = current.favicon.includes("/")
//         ? current.favicon.split("/").pop()
//         : current.favicon;

//       const oldPath = path.join(__dirname, "..", "uploads", "favicons", oldFilename);
//       try {
//         await fs.unlink(oldPath);
//         console.log(`🗑️ Deleted old favicon: ${oldPath}`);
//       } catch (err) {
//         console.log(`⚠️ Could not delete old favicon: ${err.message}`);
//       }
//     }

//     // Move uploaded file to favicons directory
//     const faviconsDir = path.join(__dirname, "..", "uploads", "favicons");
//     const newFilePath = path.join(faviconsDir, req.file.filename);

//     try {
//       await fs.rename(req.file.path, newFilePath);
//       console.log(`✅ Moved favicon to: ${newFilePath}`);
//     } catch (err) {
//       console.error(`❌ Failed to move file: ${err.message}`);
//       await fs.copyFile(req.file.path, newFilePath);
//       await fs.unlink(req.file.path);
//     }

//     // Save only the filename in database
//     const updated = { ...current, favicon: req.file.filename };
//     await SettingsModel.updateSystemSettings(updated);

//     // ✅ FIX: Return full URL with /api prefix (same as avatar)
//     const faviconUrl = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${req.file.filename}`;

//     return res.json({ success: true, data: { favicon: faviconUrl }, message: "Favicon uploaded" });
//   } catch (error) {
//     console.error("❌ uploadFavicon error:", error);
//     if (req.file) {
//       try {
//         await fs.unlink(req.file.path);
//       } catch (_) {}
//     }
//     return res.status(500).json({ success: false, message: "Failed to upload favicon" });
//   }
// };

//   // ─── REMOVE FAVICON (admin) ───────────────────────────────────────────────
//   removeFavicon = async (req, res) => {
//     try {
//       const current = await SettingsModel.getSystemSettings();

//       if (current.favicon) {
//         const filename = current.favicon.includes("/")
//           ? current.favicon.split("/").pop()
//           : current.favicon;

//         const oldPath = path.join(__dirname, "..", "uploads", "favicons", filename);
//         try {
//           await fs.unlink(oldPath);
//           console.log(`🗑️ Deleted favicon: ${oldPath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete favicon: ${err.message}`);
//         }
//       }

//       const updated = { ...current, favicon: null };
//       await SettingsModel.updateSystemSettings(updated);

//       return res.json({ success: true, data: { favicon: null }, message: "Favicon removed" });
//     } catch (error) {
//       console.error("❌ removeFavicon error:", error);
//       return res.status(500).json({ success: false, message: "Failed to remove favicon" });
//     }
//   };
// }

// module.exports = new SettingsController();


// // controllers/settingsController.js
// const SettingsModel = require("../models/settingsModel");
// const path = require("path");
// const fs = require("fs").promises;

// class SettingsController {
//   // ─── HELPER: Create upload directories if they don't exist ─────────────────
//   async _ensureUploadDirs() {
//     const dirs = [
//       path.join(__dirname, "..", "uploads", "avatars"),
//       path.join(__dirname, "..", "uploads", "logos"),
//       path.join(__dirname, "..", "uploads", "favicons"),
//     ];

//     for (const dir of dirs) {
//       try {
//         await fs.access(dir);
//       } catch {
//         await fs.mkdir(dir, { recursive: true });
//         console.log(`✅ Created directory: ${dir}`);
//       }
//     }
//   }

//   // ─── HELPER: safely pull userId from decoded JWT ───────────────────────────
//   _userId(req) {
//     if (!this._loggedOnce) {
//       console.log("🔍 req.user shape:", JSON.stringify(req.user));
//       this._loggedOnce = true;
//     }

//     return (
//       req.user.sub ||
//       req.user.id ||
//       req.user.userId ||
//       req.user.user_id ||
//       req.user.ID ||
//       null
//     );
//   }

//   // ─── GET PROFILE ──────────────────────────────────────────────────────────
//   getProfile = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: "User ID not found in token. Check authMiddleware.",
//         });
//       }

//       const user = await SettingsModel.getUserById(userId);

//       if (!user) {
//         return res.status(404).json({ success: false, message: "User not found" });
//       }

//       return res.json({ success: true, data: user });
//     } catch (error) {
//       console.error("❌ getProfile error:", error);
//       return res.status(500).json({ success: false, message: "Failed to get profile" });
//     }
//   };

//   // ─── UPDATE PROFILE (name only) ───────────────────────────────────────────
//   updateProfile = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const { full_name } = req.body;

//       if (!full_name || full_name.trim() === "") {
//         return res.status(400).json({ success: false, message: "Full name is required" });
//       }

//       const updated = await SettingsModel.updateProfile(userId, {
//         full_name: full_name.trim(),
//       });

//       return res.json({
//         success: true,
//         data: updated,
//         message: "Profile updated successfully",
//       });
//     } catch (error) {
//       console.error("❌ updateProfile error:", error);
//       return res.status(500).json({ success: false, message: "Failed to update profile" });
//     }
//   };

//   // ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
//   uploadAvatar = async (req, res) => {
//     try {
//       await this._ensureUploadDirs();
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       if (!req.file) {
//         return res.status(400).json({ success: false, message: "No image uploaded" });
//       }

//       // Delete old avatar
//       const currentUser = await SettingsModel.getUserById(userId);
//       if (currentUser && currentUser.avatar) {
//         const oldFilename = currentUser.avatar.includes("/")
//           ? currentUser.avatar.split("/").pop()
//           : currentUser.avatar;

//         const oldFilePath = path.join(__dirname, "..", "uploads", "avatars", oldFilename);
//         try {
//           await fs.unlink(oldFilePath);
//           console.log(`🗑️ Deleted old avatar: ${oldFilePath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete old avatar: ${err.message}`);
//         }
//       }

//       // Move to avatars directory
//       const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");
//       const newFilePath = path.join(avatarsDir, req.file.filename);

//       try {
//         await fs.rename(req.file.path, newFilePath);
//         console.log(`✅ Moved avatar to: ${newFilePath}`);
//       } catch (err) {
//         console.error(`❌ Failed to move file: ${err.message}`);
//         await fs.copyFile(req.file.path, newFilePath);
//         await fs.unlink(req.file.path);
//       }

//       // Save filename to database
//       await SettingsModel.updateAvatar(userId, req.file.filename);

//       // Return full URL with /api
//       const avatarUrl = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/avatars/${req.file.filename}`;

//       return res.json({ success: true, data: { avatar: avatarUrl }, message: "Avatar updated" });
//     } catch (error) {
//       console.error("❌ uploadAvatar error:", error);
//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (_) {}
//       }
//       return res.status(500).json({ success: false, message: "Failed to upload avatar" });
//     }
//   };

//   // ─── REMOVE AVATAR ────────────────────────────────────────────────────────
//   removeAvatar = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const currentUser = await SettingsModel.getUserById(userId);
//       if (currentUser && currentUser.avatar) {
//         const filename = currentUser.avatar.includes("/")
//           ? currentUser.avatar.split("/").pop()
//           : currentUser.avatar;

//         const filePath = path.join(__dirname, "..", "uploads", "avatars", filename);
//         try {
//           await fs.unlink(filePath);
//           console.log(`🗑️ Deleted avatar: ${filePath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete avatar: ${err.message}`);
//         }
//       }

//       await SettingsModel.removeAvatar(userId);

//       return res.json({ success: true, data: { avatar: null }, message: "Avatar removed" });
//     } catch (error) {
//       console.error("❌ removeAvatar error:", error);
//       return res.status(500).json({ success: false, message: "Failed to remove avatar" });
//     }
//   };

//   // ─── GET NOTIFICATION PREFERENCES ────────────────────────────────────────
//   getNotificationPrefs = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const prefs = await SettingsModel.getNotificationPreferences(userId);
//       return res.json({ success: true, data: prefs });
//     } catch (error) {
//       console.error("❌ getNotificationPrefs error:", error);
//       return res.status(500).json({ success: false, message: "Failed to get preferences" });
//     }
//   };

//   // ─── UPDATE NOTIFICATION PREFERENCES ─────────────────────────────────────
//   updateNotificationPrefs = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const { email, sms, push, whatsapp } = req.body;

//       const preferences = {
//         email: !!email,
//         sms: !!sms,
//         push: !!push,
//         whatsapp: !!whatsapp,
//       };

//       await SettingsModel.updateNotificationPreferences(userId, preferences);

//       return res.json({ success: true, data: preferences, message: "Preferences saved" });
//     } catch (error) {
//       console.error("❌ updateNotificationPrefs error:", error);
//       return res.status(500).json({ success: false, message: "Failed to save preferences" });
//     }
//   };

//   // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
//   changePassword = async (req, res) => {
//     try {
//       const userId = this._userId(req);

//       if (!userId) {
//         return res.status(401).json({ success: false, message: "User ID not found in token" });
//       }

//       const { current_password, new_password } = req.body;

//       if (!current_password || !new_password) {
//         return res.status(400).json({
//           success: false,
//           message: "current_password and new_password are required",
//         });
//       }

//       if (new_password.length < 8) {
//         return res.status(400).json({
//           success: false,
//           message: "New password must be at least 8 characters",
//         });
//       }

//       // Verify current password FIRST
//       const isMatch = await SettingsModel.verifyPassword(userId, current_password);
//       if (!isMatch) {
//         return res.status(400).json({
//           success: false,
//           message: "Current password is incorrect",
//         });
//       }

//       // Save new password
//       await SettingsModel.saveNewPassword(userId, new_password);

//       return res.json({ success: true, message: "Password changed successfully" });
//     } catch (error) {
//       console.error("❌ changePassword error:", error);
//       return res.status(500).json({ success: false, message: "Failed to change password" });
//     }
//   };

//   // ─── GET SYSTEM SETTINGS (admin) ──────────────────────────────────────────
//   getSystemSettings = async (req, res) => {
//     try {
//       const settings = await SettingsModel.getSystemSettings();

//       // Use /api prefix for consistency
//       if (settings.logo && !settings.logo.startsWith("http")) {
//         settings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${settings.logo}`;
//       }
//       if (settings.favicon && !settings.favicon.startsWith("http")) {
//         settings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${settings.favicon}`;
//       }

//       return res.json({ success: true, data: settings });
//     } catch (error) {
//       console.error("❌ getSystemSettings error:", error);
//       return res.status(500).json({ success: false, message: "Failed to get system settings" });
//     }
//   };

//   // ─── UPDATE SYSTEM SETTINGS (admin) ───────────────────────────────────────
//   updateSystemSettings = async (req, res) => {
//     try {
//       const { theme, primaryColor, timezone, dateFormat, language } = req.body;

//       const current = await SettingsModel.getSystemSettings();

//       const merged = {
//         ...current,
//         ...(theme !== undefined && { theme }),
//         ...(primaryColor !== undefined && { primaryColor }),
//         ...(timezone !== undefined && { timezone }),
//         ...(dateFormat !== undefined && { dateFormat }),
//         ...(language !== undefined && { language }),
//       };

//       await SettingsModel.updateSystemSettings(merged);

//       // ✅ Return full settings with proper URLs
//       const finalSettings = await SettingsModel.getSystemSettings();
      
//       if (finalSettings.logo && !finalSettings.logo.startsWith("http")) {
//         finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${finalSettings.logo}`;
//       }
//       if (finalSettings.favicon && !finalSettings.favicon.startsWith("http")) {
//         finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${finalSettings.favicon}`;
//       }

//       return res.json({ success: true, data: finalSettings, message: "System settings saved" });
//     } catch (error) {
//       console.error("❌ updateSystemSettings error:", error);
//       return res.status(500).json({ success: false, message: "Failed to update settings" });
//     }
//   };

//   // ─── UPLOAD LOGO (admin) ──────────────────────────────────────────────────
//   uploadLogo = async (req, res) => {
//     try {
//       await this._ensureUploadDirs();

//       if (!req.file) {
//         return res.status(400).json({ success: false, message: "No file uploaded" });
//       }

//       const current = await SettingsModel.getSystemSettings();

//       // Delete old logo file if one exists
//       if (current.logo) {
//         const oldFilename = current.logo.includes("/")
//           ? current.logo.split("/").pop()
//           : current.logo;

//         const oldPath = path.join(__dirname, "..", "uploads", "logos", oldFilename);
//         try {
//           await fs.unlink(oldPath);
//           console.log(`🗑️ Deleted old logo: ${oldPath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete old logo: ${err.message}`);
//         }
//       }

//       // Move uploaded file to logos directory
//       const logosDir = path.join(__dirname, "..", "uploads", "logos");
//       const newFilePath = path.join(logosDir, req.file.filename);

//       try {
//         await fs.rename(req.file.path, newFilePath);
//         console.log(`✅ Moved logo to: ${newFilePath}`);
//       } catch (err) {
//         console.error(`❌ Failed to move file: ${err.message}`);
//         await fs.copyFile(req.file.path, newFilePath);
//         await fs.unlink(req.file.path);
//       }

//       // Save filename in database
//       const updated = { ...current, logo: req.file.filename };
//       await SettingsModel.updateSystemSettings(updated);

//       // ✅ Return settings with full URLs (model handles this)
//       const finalSettings = await SettingsModel.getSystemSettings();
      
//       if (finalSettings.logo && !finalSettings.logo.startsWith("http")) {
//         finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${finalSettings.logo}`;
//       }
//       if (finalSettings.favicon && !finalSettings.favicon.startsWith("http")) {
//         finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${finalSettings.favicon}`;
//       }

//       // ✅ FIX: Changed success: false to success: true
//       return res.json({ 
//         success: true,  // ← THIS WAS THE BUG! It was "false" before
//         data: finalSettings, 
//         message: "Logo uploaded" 
//       });
//     } catch (error) {
//       console.error("❌ uploadLogo error:", error);
//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (_) {}
//       }
//       return res.status(500).json({ success: false, message: "Failed to upload logo" });
//     }
//   };

//   // ─── REMOVE LOGO (admin) ──────────────────────────────────────────────────
//   removeLogo = async (req, res) => {
//     try {
//       const current = await SettingsModel.getSystemSettings();

//       if (current.logo) {
//         const filename = current.logo.includes("/")
//           ? current.logo.split("/").pop()
//           : current.logo;

//         const oldPath = path.join(__dirname, "..", "uploads", "logos", filename);
//         try {
//           await fs.unlink(oldPath);
//           console.log(`🗑️ Deleted logo: ${oldPath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete logo: ${err.message}`);
//         }
//       }

//       const updated = { ...current, logo: null };
//       await SettingsModel.updateSystemSettings(updated);

//       return res.json({ success: true, data: { logo: null }, message: "Logo removed" });
//     } catch (error) {
//       console.error("❌ removeLogo error:", error);
//       return res.status(500).json({ success: false, message: "Failed to remove logo" });
//     }
//   };

//   // ─── UPLOAD FAVICON (admin) ───────────────────────────────────────────────
//   uploadFavicon = async (req, res) => {
//     try {
//       await this._ensureUploadDirs();

//       if (!req.file) {
//         return res.status(400).json({ success: false, message: "No file uploaded" });
//       }

//       const current = await SettingsModel.getSystemSettings();

//       // Delete old favicon file if one exists
//       if (current.favicon) {
//         const oldFilename = current.favicon.includes("/")
//           ? current.favicon.split("/").pop()
//           : current.favicon;

//         const oldPath = path.join(__dirname, "..", "uploads", "favicons", oldFilename);
//         try {
//           await fs.unlink(oldPath);
//           console.log(`🗑️ Deleted old favicon: ${oldPath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete old favicon: ${err.message}`);
//         }
//       }

//       // Move uploaded file to favicons directory
//       const faviconsDir = path.join(__dirname, "..", "uploads", "favicons");
//       const newFilePath = path.join(faviconsDir, req.file.filename);

//       try {
//         await fs.rename(req.file.path, newFilePath);
//         console.log(`✅ Moved favicon to: ${newFilePath}`);
//       } catch (err) {
//         console.error(`❌ Failed to move file: ${err.message}`);
//         await fs.copyFile(req.file.path, newFilePath);
//         await fs.unlink(req.file.path);
//       }

//       // Save filename in database
//       const updated = { ...current, favicon: req.file.filename };
//       await SettingsModel.updateSystemSettings(updated);

//       // ✅ Return settings with full URLs (model handles this)
//       const finalSettings = await SettingsModel.getSystemSettings();
      
//       if (finalSettings.logo && !finalSettings.logo.startsWith("http")) {
//         finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${finalSettings.logo}`;
//       }
//       if (finalSettings.favicon && !finalSettings.favicon.startsWith("http")) {
//         finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${finalSettings.favicon}`;
//       }

//       return res.json({ 
//         success: true, 
//         data: finalSettings, 
//         message: "Favicon uploaded" 
//       });
//     } catch (error) {
//       console.error("❌ uploadFavicon error:", error);
//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (_) {}
//       }
//       return res.status(500).json({ success: false, message: "Failed to upload favicon" });
//     }
//   };

//   // ─── REMOVE FAVICON (admin) ───────────────────────────────────────────────
//   removeFavicon = async (req, res) => {
//     try {
//       const current = await SettingsModel.getSystemSettings();

//       if (current.favicon) {
//         const filename = current.favicon.includes("/")
//           ? current.favicon.split("/").pop()
//           : current.favicon;

//         const oldPath = path.join(__dirname, "..", "uploads", "favicons", filename);
//         try {
//           await fs.unlink(oldPath);
//           console.log(`🗑️ Deleted favicon: ${oldPath}`);
//         } catch (err) {
//           console.log(`⚠️ Could not delete favicon: ${err.message}`);
//         }
//       }

//       const updated = { ...current, favicon: null };
//       await SettingsModel.updateSystemSettings(updated);

//       return res.json({ success: true, data: { favicon: null }, message: "Favicon removed" });
//     } catch (error) {
//       console.error("❌ removeFavicon error:", error);
//       return res.status(500).json({ success: false, message: "Failed to remove favicon" });
//     }
//   };
// }

// module.exports = new SettingsController();



const SettingsModel = require("../models/settingsModel");
const path = require("path");
const fs = require("fs").promises;

class SettingsController {
  // ─── HELPER: Create upload directories if they don't exist ─────────────────
  async _ensureUploadDirs() {
    const dirs = [
      path.join(__dirname, "..", "uploads", "avatars"),
      path.join(__dirname, "..", "uploads", "logos"),
      path.join(__dirname, "..", "uploads", "favicons"),
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
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
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.json({ success: true, data: user });
    } catch (error) {
      console.error("❌ getProfile error:", error);
      return res.status(500).json({ success: false, message: "Failed to get profile" });
    }
  };

  // ─── UPDATE PROFILE (name only) ───────────────────────────────────────────
  updateProfile = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID not found in token" });
      }

      const { full_name } = req.body;

      if (!full_name || full_name.trim() === "") {
        return res.status(400).json({ success: false, message: "Full name is required" });
      }

      const updated = await SettingsModel.updateProfile(userId, {
        full_name: full_name.trim(),
      });

      return res.json({
        success: true,
        data: updated,
        message: "Profile updated successfully",
      });
    } catch (error) {
      console.error("❌ updateProfile error:", error);
      return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  };

  // ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
  uploadAvatar = async (req, res) => {
    try {
      await this._ensureUploadDirs();
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID not found in token" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
      }

      // Delete old avatar
      const currentUser = await SettingsModel.getUserById(userId);
      if (currentUser && currentUser.avatar) {
        const oldFilename = currentUser.avatar.includes("/")
          ? currentUser.avatar.split("/").pop()
          : currentUser.avatar;

        const oldFilePath = path.join(__dirname, "..", "uploads", "avatars", oldFilename);
        try {
          await fs.unlink(oldFilePath);
          console.log(`🗑️ Deleted old avatar: ${oldFilePath}`);
        } catch (err) {
          console.log(`⚠️ Could not delete old avatar: ${err.message}`);
        }
      }

      // Move to avatars directory
      const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");
      const newFilePath = path.join(avatarsDir, req.file.filename);

      try {
        await fs.rename(req.file.path, newFilePath);
        console.log(`✅ Moved avatar to: ${newFilePath}`);
      } catch (err) {
        console.error(`❌ Failed to move file: ${err.message}`);
        await fs.copyFile(req.file.path, newFilePath);
        await fs.unlink(req.file.path);
      }

      // Save filename to database
      await SettingsModel.updateAvatar(userId, req.file.filename);

      // Return full URL with /api
      const avatarUrl = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/avatars/${req.file.filename}`;

      return res.json({ success: true, data: { avatar: avatarUrl }, message: "Avatar updated" });
    } catch (error) {
      console.error("❌ uploadAvatar error:", error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      }
      return res.status(500).json({ success: false, message: "Failed to upload avatar" });
    }
  };

  // ─── REMOVE AVATAR ────────────────────────────────────────────────────────
  removeAvatar = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID not found in token" });
      }

      const currentUser = await SettingsModel.getUserById(userId);
      if (currentUser && currentUser.avatar) {
        const filename = currentUser.avatar.includes("/")
          ? currentUser.avatar.split("/").pop()
          : currentUser.avatar;

        const filePath = path.join(__dirname, "..", "uploads", "avatars", filename);
        try {
          await fs.unlink(filePath);
          console.log(`🗑️ Deleted avatar: ${filePath}`);
        } catch (err) {
          console.log(`⚠️ Could not delete avatar: ${err.message}`);
        }
      }

      await SettingsModel.removeAvatar(userId);

      return res.json({ success: true, data: { avatar: null }, message: "Avatar removed" });
    } catch (error) {
      console.error("❌ removeAvatar error:", error);
      return res.status(500).json({ success: false, message: "Failed to remove avatar" });
    }
  };

  // ─── GET NOTIFICATION PREFERENCES ────────────────────────────────────────
  getNotificationPrefs = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID not found in token" });
      }

      const prefs = await SettingsModel.getNotificationPreferences(userId);
      return res.json({ success: true, data: prefs });
    } catch (error) {
      console.error("❌ getNotificationPrefs error:", error);
      return res.status(500).json({ success: false, message: "Failed to get preferences" });
    }
  };

  // ─── UPDATE NOTIFICATION PREFERENCES ─────────────────────────────────────
  updateNotificationPrefs = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID not found in token" });
      }

      const { email, sms, push, whatsapp } = req.body;

      const preferences = {
        email: !!email,
        sms: !!sms,
        push: !!push,
        whatsapp: !!whatsapp,
      };

      await SettingsModel.updateNotificationPreferences(userId, preferences);

      return res.json({ success: true, data: preferences, message: "Preferences saved" });
    } catch (error) {
      console.error("❌ updateNotificationPrefs error:", error);
      return res.status(500).json({ success: false, message: "Failed to save preferences" });
    }
  };

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
  changePassword = async (req, res) => {
    try {
      const userId = this._userId(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: "User ID not found in token" });
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
      const isMatch = await SettingsModel.verifyPassword(userId, current_password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Save new password
      await SettingsModel.saveNewPassword(userId, new_password);

      return res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("❌ changePassword error:", error);
      return res.status(500).json({ success: false, message: "Failed to change password" });
    }
  };

  // ─── GET SYSTEM SETTINGS (admin) ──────────────────────────────────────────
  getSystemSettings = async (req, res) => {
    try {
      const settings = await SettingsModel.getSystemSettings();

      // Use /api prefix for consistency
      if (settings.logo && !settings.logo.startsWith("http")) {
        settings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${settings.logo}`;
      }
      if (settings.favicon && !settings.favicon.startsWith("http")) {
        settings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${settings.favicon}`;
      }

      return res.json({ success: true, data: settings });
    } catch (error) {
      console.error("❌ getSystemSettings error:", error);
      return res.status(500).json({ success: false, message: "Failed to get system settings" });
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

      // Remove full URLs from logo/favicon if present (they should be filenames only in DB)
      if (merged.logo && merged.logo.includes('/')) {
        merged.logo = merged.logo.split('/').pop();
      }
      if (merged.favicon && merged.favicon.includes('/')) {
        merged.favicon = merged.favicon.split('/').pop();
      }

      await SettingsModel.updateSystemSettings(merged);

      // ✅ Return full settings with proper URLs
      const finalSettings = await SettingsModel.getSystemSettings();
      
      if (finalSettings.logo && !finalSettings.logo.startsWith("http")) {
        finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${finalSettings.logo}`;
      }
      if (finalSettings.favicon && !finalSettings.favicon.startsWith("http")) {
        finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${finalSettings.favicon}`;
      }

      return res.json({ success: true, data: finalSettings, message: "System settings saved" });
    } catch (error) {
      console.error("❌ updateSystemSettings error:", error);
      return res.status(500).json({ success: false, message: "Failed to update settings" });
    }
  };

  // ─── UPLOAD LOGO (admin) ──────────────────────────────────────────────────
  uploadLogo = async (req, res) => {
    try {
      await this._ensureUploadDirs();

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const current = await SettingsModel.getSystemSettings();

      // Delete old logo file if one exists
      if (current.logo) {
        const oldFilename = current.logo.includes("/")
          ? current.logo.split("/").pop()
          : current.logo;

        if (oldFilename) {
          const oldPath = path.join(__dirname, "..", "uploads", "logos", oldFilename);
          try {
            await fs.unlink(oldPath);
            console.log(`🗑️ Deleted old logo: ${oldPath}`);
          } catch (err) {
            console.log(`⚠️ Could not delete old logo: ${err.message}`);
          }
        }
      }

      // Move uploaded file to logos directory
      const logosDir = path.join(__dirname, "..", "uploads", "logos");
      const newFilePath = path.join(logosDir, req.file.filename);

      try {
        await fs.rename(req.file.path, newFilePath);
        console.log(`✅ Moved logo to: ${newFilePath}`);
      } catch (err) {
        console.error(`❌ Failed to move file: ${err.message}`);
        await fs.copyFile(req.file.path, newFilePath);
        await fs.unlink(req.file.path);
      }

      // Save ONLY logo filename in database using the new method
      await SettingsModel.updateLogo(req.file.filename);

      // Get updated settings
      const finalSettings = await SettingsModel.getSystemSettings();
      
      // Add full URLs for response
      if (finalSettings.logo && !finalSettings.logo.startsWith("http")) {
        finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${finalSettings.logo}`;
      }
      if (finalSettings.favicon && !finalSettings.favicon.startsWith("http")) {
        finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${finalSettings.favicon}`;
      }

      return res.json({ 
        success: true,
        data: finalSettings, 
        message: "Logo uploaded successfully" 
      });
    } catch (error) {
      console.error("❌ uploadLogo error:", error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      }
      return res.status(500).json({ success: false, message: "Failed to upload logo" });
    }
  };

  // ─── REMOVE LOGO (admin) ──────────────────────────────────────────────────
  removeLogo = async (req, res) => {
    try {
      const current = await SettingsModel.getSystemSettings();

      if (current.logo) {
        const filename = current.logo.includes("/")
          ? current.logo.split("/").pop()
          : current.logo;

        if (filename) {
          const oldPath = path.join(__dirname, "..", "uploads", "logos", filename);
          try {
            await fs.unlink(oldPath);
            console.log(`🗑️ Deleted logo: ${oldPath}`);
          } catch (err) {
            console.log(`⚠️ Could not delete logo: ${err.message}`);
          }
        }
      }

      // Remove logo from database using the new method
      const updated = await SettingsModel.removeLogo();

      // Add full URLs for response
      if (updated.logo && !updated.logo.startsWith("http")) {
        updated.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${updated.logo}`;
      }
      if (updated.favicon && !updated.favicon.startsWith("http")) {
        updated.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${updated.favicon}`;
      }

      return res.json({ 
        success: true, 
        data: updated, 
        message: "Logo removed successfully" 
      });
    } catch (error) {
      console.error("❌ removeLogo error:", error);
      return res.status(500).json({ success: false, message: "Failed to remove logo" });
    }
  };

  // ─── UPLOAD FAVICON (admin) ───────────────────────────────────────────────
  uploadFavicon = async (req, res) => {
    try {
      await this._ensureUploadDirs();

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const current = await SettingsModel.getSystemSettings();

      // Delete old favicon file if one exists
      if (current.favicon) {
        const oldFilename = current.favicon.includes("/")
          ? current.favicon.split("/").pop()
          : current.favicon;

        if (oldFilename) {
          const oldPath = path.join(__dirname, "..", "uploads", "favicons", oldFilename);
          try {
            await fs.unlink(oldPath);
            console.log(`🗑️ Deleted old favicon: ${oldPath}`);
          } catch (err) {
            console.log(`⚠️ Could not delete old favicon: ${err.message}`);
          }
        }
      }

      // Move uploaded file to favicons directory
      const faviconsDir = path.join(__dirname, "..", "uploads", "favicons");
      const newFilePath = path.join(faviconsDir, req.file.filename);

      try {
        await fs.rename(req.file.path, newFilePath);
        console.log(`✅ Moved favicon to: ${newFilePath}`);
      } catch (err) {
        console.error(`❌ Failed to move file: ${err.message}`);
        await fs.copyFile(req.file.path, newFilePath);
        await fs.unlink(req.file.path);
      }

      // Save ONLY favicon filename in database using the new method
      await SettingsModel.updateFavicon(req.file.filename);

      // Get updated settings
      const finalSettings = await SettingsModel.getSystemSettings();
      
      // Add full URLs for response
      if (finalSettings.logo && !finalSettings.logo.startsWith("http")) {
        finalSettings.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${finalSettings.logo}`;
      }
      if (finalSettings.favicon && !finalSettings.favicon.startsWith("http")) {
        finalSettings.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${finalSettings.favicon}`;
      }

      return res.json({ 
        success: true, 
        data: finalSettings, 
        message: "Favicon uploaded successfully" 
      });
    } catch (error) {
      console.error("❌ uploadFavicon error:", error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (_) {}
      }
      return res.status(500).json({ success: false, message: "Failed to upload favicon" });
    }
  };

  // ─── REMOVE FAVICON (admin) ───────────────────────────────────────────────
  removeFavicon = async (req, res) => {
    try {
      const current = await SettingsModel.getSystemSettings();

      if (current.favicon) {
        const filename = current.favicon.includes("/")
          ? current.favicon.split("/").pop()
          : current.favicon;

        if (filename) {
          const oldPath = path.join(__dirname, "..", "uploads", "favicons", filename);
          try {
            await fs.unlink(oldPath);
            console.log(`🗑️ Deleted favicon: ${oldPath}`);
          } catch (err) {
            console.log(`⚠️ Could not delete favicon: ${err.message}`);
          }
        }
      }

      // Remove favicon from database using the new method
      const updated = await SettingsModel.removeFavicon();

      // Add full URLs for response
      if (updated.logo && !updated.logo.startsWith("http")) {
        updated.logo = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/logos/${updated.logo}`;
      }
      if (updated.favicon && !updated.favicon.startsWith("http")) {
        updated.favicon = `${process.env.BASE_URL || "http://localhost:4000"}/api/uploads/favicons/${updated.favicon}`;
      }

      return res.json({ 
        success: true, 
        data: updated, 
        message: "Favicon removed successfully" 
      });
    } catch (error) {
      console.error("❌ removeFavicon error:", error);
      return res.status(500).json({ success: false, message: "Failed to remove favicon" });
    }
  };
}

module.exports = new SettingsController();