const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const LocationController = require("../controllers/locationController");
const { query: dbQuery } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// UUID validator
const validateUUID = param("id")
  .isString()
  .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .withMessage("Invalid UUID format");

// Validation schemas
const createLocationValidation = [
  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be 2-100 characters"),
  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be 2-100 characters"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be 2-100 characters"),
  body("pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Pincode must be 3-20 characters"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
];

const updateLocationValidation = [
  validateUUID,
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be 2-100 characters"),
  body("state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be 2-100 characters"),
  body("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be 2-100 characters"),
  body("pincode")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Pincode must be 3-20 characters"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
];

// Apply auth middleware
router.use(authMiddleware);

// Test endpoints for debugging
router.get("/test/all", async (req, res) => {
  try {
    const rows = await dbQuery("SELECT * FROM locations ORDER BY created_at DESC");
    
    res.json({
      success: true,
      total_count: rows.length,
      data: rows,
      message: "All locations (raw database query)"
    });
  } catch (error) {
    console.error("Error fetching all locations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all locations",
      message: error.message
    });
  }
});

// Get all locations
router.get("/", LocationController.getAllLocations);

// Get location statistics
router.get("/stats", LocationController.getLocationStats);

// Search locations
router.get(
  "/search",
  [
    query("query")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters")
  ],
  LocationController.searchLocations
);

// Get unique countries
router.get("/countries", LocationController.getCountries);

// Get states by country
router.get("/countries/:country/states", LocationController.getStatesByCountry);

// Get cities by state
router.get("/states/:state/cities", LocationController.getCitiesByState);

// Get pincodes by city
router.get("/cities/:city/pincodes", LocationController.getPincodesByCity);

// Get locations by country
router.get("/country/:country", LocationController.getLocationsByCountry);

// Get locations by state
router.get("/state/:state", LocationController.getLocationsByState);

// Get locations by city
router.get("/city/:city", LocationController.getLocationsByCity);

// Get location by ID
router.get("/:id", [validateUUID], LocationController.getLocationById);

// Create location
router.post("/", createLocationValidation, LocationController.createLocation);

// Update location
router.put("/:id", updateLocationValidation, LocationController.updateLocation);

// Delete location
router.delete("/:id", [validateUUID], LocationController.deleteLocation);

// Toggle location active status
router.patch("/:id/toggle", [validateUUID], LocationController.toggleLocationActive);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Location API endpoint not found"
  });
});

module.exports = router;