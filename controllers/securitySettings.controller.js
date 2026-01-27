const SecuritySettings = require("../models/securitySettings.model");
const { promisePool } = require("../config/db");

/**
 * Get security settings
 */
exports.getSecuritySettings = async (req, res) => {
    try {
        const settings = await SecuritySettings.findSettings();
        
        if (!settings) {
            const defaultSettings = await SecuritySettings.updateSettings({
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
            });
            return res.json(defaultSettings);
        }

        res.json(settings);
    } catch (error) {
        console.error("Get security settings error:", error);
        res.status(500).json({ 
            message: "Failed to fetch security settings",
            error: error.message 
        });
    }
};

/**
 * Update security settings
 */
exports.updateSecuritySettings = async (req, res) => {
    try {
        const settingsData = req.body;
        
        // Validate numeric fields
        const numericFields = {
            'punch_in_radius_meters': { min: 50, max: 5000, default: 200 },
            'punch_out_radius_meters': { min: 50, max: 5000, default: 200 },
            'max_punch_distance_meters': { min: 100, max: 10000, default: 500 },
            'auto_punchout_radius_km': { min: 0.1, max: 10, default: 1.0 },
            'auto_punchout_delay_minutes': { min: 1, max: 60, default: 15 }
        };
        
        // Set default values for missing numeric fields
        for (const [field, config] of Object.entries(numericFields)) {
            if (settingsData[field] === undefined) {
                settingsData[field] = config.default;
            } else {
                const value = parseFloat(settingsData[field]);
                if (isNaN(value) || value < config.min || value > config.max) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be between ${config.min} and ${config.max}`
                    });
                }
            }
        }
        
        // Set default boolean fields if not provided
        const booleanFields = [
            'auto_punchout_enabled',
            'geolocation_tracking_enabled',
            'require_selfie_on_punch',
            'location_validation_enabled',
            'allow_remote_punch',
            'enable_face_recognition',
            'require_live_selfie',
            'allow_weekend_punch'
        ];
        
        booleanFields.forEach(field => {
            if (settingsData[field] === undefined) {
                settingsData[field] = false;
            }
        });
        
        // Set default times if not provided
        if (!settingsData.max_punch_in_time) {
            settingsData.max_punch_in_time = '10:30:00';
        }
        if (!settingsData.min_punch_out_time) {
            settingsData.min_punch_out_time = '18:00:00';
        }
        
        const updatedSettings = await SecuritySettings.updateSettings(settingsData);
        
        res.json({
            success: true,
            message: "Security settings updated successfully",
            data: updatedSettings
        });
    } catch (error) {
        console.error("Update security settings error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to update security settings",
            error: error.message 
        });
    }
};

/**
 * Reset security settings to defaults
 */
exports.resetSecuritySettings = async (req, res) => {
    try {
        const resetSettings = await SecuritySettings.resetSettings();
        
        res.json({
            success: true,
            message: "Security settings reset to defaults",
            data: resetSettings
        });
    } catch (error) {
        console.error("Reset security settings error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to reset security settings",
            error: error.message 
        });
    }
};

/**
 * Validate punch location (for attendance module)
 */
exports.validatePunchLocation = async (req, res) => {
    try {
        const { 
            employee_id, 
            latitude, 
            longitude, 
            punch_type = 'punch_in',
            office_location_id 
        } = req.body;
        
        if (!employee_id || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Employee ID, latitude, and longitude are required"
            });
        }
        
        // Get security settings
        const settings = await SecuritySettings.findSettings();
        if (!settings) {
            return res.status(500).json({
                success: false,
                message: "Security settings not configured"
            });
        }
        
        // Check if location validation is enabled
        if (!settings.location_validation_enabled) {
            return res.json({
                valid: true,
                distance: 0,
                required_radius: 0,
                office_location: { latitude: 0, longitude: 0 },
                message: "Location validation is disabled"
            });
        }
        
        // Get office location coordinates
        const [officeRows] = await promisePool.query(
            "SELECT latitude, longitude, geofence_radius_meters FROM office_locations WHERE id = ?",
            [office_location_id]
        );
        
        if (!officeRows.length) {
            return res.status(404).json({
                success: false,
                message: "Office location not found"
            });
        }
        
        const officeLocation = officeRows[0];
        const officeLat = officeLocation.latitude;
        const officeLon = officeLocation.longitude;
        const officeRadius = officeLocation.geofence_radius_meters || settings.punch_in_radius_meters;
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
            parseFloat(latitude), 
            parseFloat(longitude), 
            parseFloat(officeLat), 
            parseFloat(officeLon)
        );
        
        // Determine required radius based on punch type
        let requiredRadius;
        if (punch_type === 'punch_in') {
            requiredRadius = settings.punch_in_radius_meters;
        } else if (punch_type === 'punch_out') {
            requiredRadius = settings.punch_out_radius_meters;
        } else {
            requiredRadius = officeRadius;
        }
        
        const isValid = distance <= requiredRadius;
        
        // Log the validation
        await SecuritySettings.logValidation({
            attendance_id: null,
            employee_id,
            validation_type: punch_type,
            validation_result: isValid ? 'success' : 'failed',
            distance_meters: distance,
            required_radius_meters: requiredRadius,
            latitude,
            longitude,
            office_location_id,
            validation_message: isValid 
                ? `Punch location is within ${requiredRadius} meters` 
                : `Punch location is ${distance.toFixed(2)} meters away, maximum allowed is ${requiredRadius} meters`
        });
        
        res.json({
            valid: isValid,
            distance: distance,
            required_radius: requiredRadius,
            office_location: {
                latitude: officeLat,
                longitude: officeLon
            },
            message: isValid 
                ? "Location is within allowed radius" 
                : "Location is outside allowed radius"
        });
        
    } catch (error) {
        console.error("Validate punch location error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to validate punch location",
            error: error.message 
        });
    }
};

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

/**
 * Get punch radius settings (for attendance module)
 */
exports.getPunchRadiusSettings = async (req, res) => {
    try {
        const settings = await SecuritySettings.findSettings();
        
        if (!settings) {
            return res.json({
                punch_in_radius_meters: 200,
                punch_out_radius_meters: 200,
                max_punch_distance_meters: 500,
                location_validation_enabled: true
            });
        }
        
        res.json({
            punch_in_radius_meters: settings.punch_in_radius_meters,
            punch_out_radius_meters: settings.punch_out_radius_meters,
            max_punch_distance_meters: settings.max_punch_distance_meters,
            location_validation_enabled: settings.location_validation_enabled
        });
    } catch (error) {
        console.error("Get punch radius settings error:", error);
        res.status(500).json({ 
            message: "Failed to get punch radius settings",
            error: error.message 
        });
    }
};