const { promisePool } = require("../config/db");

/**
 * Get security settings
 */
const findSettings = async () => {
    try {
        const [rows] = await promisePool.query(
            "SELECT * FROM hrms_security_settings ORDER BY id DESC LIMIT 1"
        );
        return rows[0] || null;
    } catch (error) {
        console.error("Find security settings error:", error);
        throw error;
    }
};

/**
 * Update security settings
 */
const updateSettings = async (data) => {
    try {
        const fields = [];
        const values = [];

        // Allowed fields for update
        const allowedFields = [
            "auto_punchout_enabled",
            "auto_punchout_radius_km",
            "auto_punchout_delay_minutes",
            "geolocation_tracking_enabled",
            "require_selfie_on_punch",
            "location_validation_enabled",
            "punch_in_radius_meters",
            "punch_out_radius_meters",
            "allow_remote_punch",
            "max_punch_distance_meters",
            "enable_face_recognition",
            "require_live_selfie",
            "max_punch_in_time",
            "min_punch_out_time",
            "allow_weekend_punch"
        ];

        // Add fields to update
        allowedFields.forEach((key) => {
            if (data[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        });

        if (fields.length === 0) {
            return await findSettings();
        }

        // First, check if settings exist
        const existingSettings = await findSettings();
        
        if (existingSettings) {
            // Update existing settings
            values.push(existingSettings.id);
            const sql = `UPDATE hrms_security_settings SET ${fields.join(", ")} WHERE id = ?`;
            await promisePool.query(sql, values);
        } else {
            // Insert new settings
            const sql = `INSERT INTO hrms_security_settings (${fields.map(f => f.split(' = ')[0])}) VALUES (${fields.map(() => '?')})`;
            await promisePool.query(sql, values);
        }

        return await findSettings();
    } catch (error) {
        console.error("Update security settings error:", error);
        throw error;
    }
};

/**
 * Reset security settings to defaults
 */
const resetSettings = async () => {
    try {
        const defaultSettings = {
            auto_punchout_enabled: true,
            auto_punchout_radius_km: 1.00,
            auto_punchout_delay_minutes: 15,
            geolocation_tracking_enabled: true,
            require_selfie_on_punch: false,
            location_validation_enabled: true,
            punch_in_radius_meters: 200,
            punch_out_radius_meters: 200,
            allow_remote_punch: false,
            max_punch_distance_meters: 500,
            enable_face_recognition: false,
            require_live_selfie: false,
            max_punch_in_time: '10:30:00',
            min_punch_out_time: '18:00:00',
            allow_weekend_punch: false
        };

        return await updateSettings(defaultSettings);
    } catch (error) {
        console.error("Reset security settings error:", error);
        throw error;
    }
};

/**
 * Get punch radius settings for validation
 */
const getPunchRadiusSettings = async () => {
    try {
        const settings = await findSettings();
        return {
            punch_in_radius_meters: settings?.punch_in_radius_meters || 200,
            punch_out_radius_meters: settings?.punch_out_radius_meters || 200,
            max_punch_distance_meters: settings?.max_punch_distance_meters || 500,
            location_validation_enabled: settings?.location_validation_enabled || true
        };
    } catch (error) {
        console.error("Get punch radius settings error:", error);
        throw error;
    }
};

/**
 * Log attendance validation
 */
const logValidation = async (data) => {
    try {
        const [result] = await promisePool.query(
            `INSERT INTO attendance_validation_logs 
            (attendance_id, employee_id, validation_type, validation_result, 
             distance_meters, required_radius_meters, latitude, longitude, 
             office_location_id, validation_message) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.attendance_id,
                data.employee_id,
                data.validation_type,
                data.validation_result,
                data.distance_meters,
                data.required_radius_meters,
                data.latitude,
                data.longitude,
                data.office_location_id,
                data.validation_message
            ]
        );
        return result.insertId;
    } catch (error) {
        console.error("Log validation error:", error);
        throw error;
    }
};

module.exports = {
    findSettings,
    updateSettings,
    resetSettings,
    getPunchRadiusSettings,
    logValidation
};