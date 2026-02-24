const Location = require("../models/locationModel");
const { validationResult } = require("express-validator");

class LocationController {
  // Get all locations
  // Update the getAllLocations method in locationController.js to not expect user names
  static async getAllLocations(req, res) {
    try {
      const locations = await Location.findAll();

      // Return simplified response without user names
      res.json({
        success: true,
        data: locations,
        message: "Locations fetched successfully",
        count: locations.length,
      });
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch locations",
        message: error.message,
      });
    }
  }
  // Get location by ID
  static async getLocationById(req, res) {
    try {
      const { id } = req.params;
      const location = await Location.findById(id);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: "Location not found",
        });
      }

      res.json({
        success: true,
        data: location,
        message: "Location fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch location",
        message: error.message,
      });
    }
  }

  // Create location
  static async createLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { country, state, city, pincode, is_active = true } = req.body;

      const location = await Location.create({
        country,
        state,
        city,
        pincode,
        is_active,
        created_by: req.user?.id || null,
      });

      res.status(201).json({
        success: true,
        data: location,
        message: "Location created successfully",
      });
    } catch (error) {
      console.error("Error creating location:", error);

      let errorMessage = error.message;
      let statusCode = 500;

      if (error.message.includes("already exists")) {
        errorMessage = "A location with these details already exists";
        statusCode = 409;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: errorMessage,
      });
    }
  }

  // Update location
  static async updateLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const location = await Location.findById(id);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: "Location not found",
        });
      }

      const updateData = {
        ...req.body,
        updated_by: req.user?.id || null,
      };

      const updatedLocation = await Location.update(id, updateData);

      res.json({
        success: true,
        data: updatedLocation,
        message: "Location updated successfully",
      });
    } catch (error) {
      console.error("Error updating location:", error);

      let errorMessage = error.message;
      let statusCode = 500;

      if (error.message.includes("already exists")) {
        errorMessage = "A location with these details already exists";
        statusCode = 409;
      } else if (error.message.includes("not found")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: errorMessage,
      });
    }
  }

  // Delete location
  static async deleteLocation(req, res) {
    try {
      const { id } = req.params;
      const location = await Location.findById(id);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: "Location not found",
        });
      }

      await Location.delete(id);

      res.json({
        success: true,
        message: "Location deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete location",
        message: "You have used this data some where you can not delete it.",
      });
    }
  }

  // Toggle active status
  static async toggleLocationActive(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findById(id);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: "Location not found",
        });
      }

      const updatedLocation = await Location.toggleActive(id);

      res.json({
        success: true,
        data: updatedLocation,
        message: `Location ${updatedLocation.is_active ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling location status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle location status",
        message: error.message,
      });
    }
  }

  // Get locations by country
  static async getLocationsByCountry(req, res) {
    try {
      const { country } = req.params;

      const locations = await Location.findByCountry(country);

      res.json({
        success: true,
        data: locations,
        message: "Locations fetched successfully",
        count: locations.length,
      });
    } catch (error) {
      console.error("Error fetching locations by country:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch locations",
        message: error.message,
      });
    }
  }

  // Get locations by state
  static async getLocationsByState(req, res) {
    try {
      const { state } = req.params;

      const locations = await Location.findByState(state);

      res.json({
        success: true,
        data: locations,
        message: "Locations fetched successfully",
        count: locations.length,
      });
    } catch (error) {
      console.error("Error fetching locations by state:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch locations",
        message: error.message,
      });
    }
  }

  // Get locations by city
  static async getLocationsByCity(req, res) {
    try {
      const { city } = req.params;

      const locations = await Location.findByCity(city);

      res.json({
        success: true,
        data: locations,
        message: "Locations fetched successfully",
        count: locations.length,
      });
    } catch (error) {
      console.error("Error fetching locations by city:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch locations",
        message: error.message,
      });
    }
  }

  // Get statistics
  static async getLocationStats(req, res) {
    try {
      const stats = await Location.getStats();
      res.json({
        success: true,
        data: stats,
        message: "Location statistics fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching location stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
        message: error.message,
      });
    }
  }

  // Search locations
  static async searchLocations(req, res) {
    try {
      const { query } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters",
        });
      }

      const locations = await Location.search(query.trim());

      res.json({
        success: true,
        data: locations,
        message: "Locations search completed",
        count: locations.length,
      });
    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search locations",
        message: error.message,
      });
    }
  }

  // Get unique countries
  static async getCountries(req, res) {
    try {
      const countries = await Location.getCountries();
      res.json({
        success: true,
        data: countries,
        message: "Countries fetched successfully",
        count: countries.length,
      });
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch countries",
        message: error.message,
      });
    }
  }

  // Get states by country
  static async getStatesByCountry(req, res) {
    try {
      const { country } = req.params;

      const states = await Location.getStatesByCountry(country);
      res.json({
        success: true,
        data: states,
        message: "States fetched successfully",
        count: states.length,
      });
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch states",
        message: error.message,
      });
    }
  }

  // Get cities by state
  static async getCitiesByState(req, res) {
    try {
      const { state } = req.params;

      const cities = await Location.getCitiesByState(state);
      res.json({
        success: true,
        data: cities,
        message: "Cities fetched successfully",
        count: cities.length,
      });
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch cities",
        message: error.message,
      });
    }
  }

  // Get pincodes by city
  static async getPincodesByCity(req, res) {
    try {
      const { city } = req.params;

      const pincodes = await Location.getPincodesByCity(city);
      res.json({
        success: true,
        data: pincodes,
        message: "Pincodes fetched successfully",
        count: pincodes.length,
      });
    } catch (error) {
      console.error("Error fetching pincodes:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch pincodes",
        message: error.message,
      });
    }
  }
}

module.exports = LocationController;
