const { query } = require("../config/db");

class Location {
  // Get all locations (FIXED: Removed JOINs to avoid collation errors)
  static async findAll() {
    try {
      const rows = await query(`
        SELECT * FROM locations 
        ORDER BY is_active DESC, country, state, city, pincode
      `);
      return rows.map(row => this.normalizeRow(row));
    } catch (error) {
      console.error("Error in Location.findAll:", error);
      throw error;
    }
  }

  // Get by ID (FIXED: Removed JOINs)
  static async findById(id) {
    try {
      const rows = await query(
        `SELECT * FROM locations WHERE id = ? LIMIT 1`,
        [id]
      );
      return rows.length ? this.normalizeRow(rows[0]) : null;
    } catch (error) {
      console.error(`Error in Location.findById(${id}):`, error);
      throw error;
    }
  }

  // Get locations by country (FIXED: Simple query)
  static async findByCountry(country) {
    try {
      const rows = await query(
        `SELECT * FROM locations WHERE country = ? ORDER BY state, city, pincode`,
        [country]
      );
      return rows.map(row => this.normalizeRow(row));
    } catch (error) {
      console.error(`Error in Location.findByCountry(${country}):`, error);
      throw error;
    }
  }

  // Get locations by state (FIXED: Simple query)
  static async findByState(state) {
    try {
      const rows = await query(
        `SELECT * FROM locations WHERE state = ? ORDER BY city, pincode`,
        [state]
      );
      return rows.map(row => this.normalizeRow(row));
    } catch (error) {
      console.error(`Error in Location.findByState(${state}):`, error);
      throw error;
    }
  }

  // Get locations by city (FIXED: Simple query)
  static async findByCity(city) {
    try {
      const rows = await query(
        `SELECT * FROM locations WHERE city = ? ORDER BY pincode`,
        [city]
      );
      return rows.map(row => this.normalizeRow(row));
    } catch (error) {
      console.error(`Error in Location.findByCity(${city}):`, error);
      throw error;
    }
  }

  // Check if location exists (for unique constraint)
  static async exists(country, state, city, pincode, excludeId = null) {
    try {
      let sql = `SELECT id FROM locations WHERE country = ? AND state = ? AND city = ? AND pincode = ?`;
      const params = [country, state, city, pincode];
      
      if (excludeId) {
        sql += ` AND id != ?`;
        params.push(excludeId);
      }
      
      sql += ` LIMIT 1`;
      const rows = await query(sql, params);
      return rows.length > 0;
    } catch (error) {
      console.error("Error in Location.exists:", error);
      throw error;
    }
  }

  // Create location
  static async create({
    country,
    state,
    city,
    pincode,
    is_active = true,
    created_by = null
  }) {
    try {
      // Check if location already exists
      const exists = await this.exists(country, state, city, pincode);
      if (exists) {
        throw new Error('Location already exists');
      }

      const sql = `
        INSERT INTO locations 
        (country, state, city, pincode, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const result = await query(sql, [
        country.trim(),
        state.trim(),
        city.trim(),
        pincode.trim(),
        is_active ? 1 : 0,
        created_by
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error("Error in Location.create:", error);
      throw error;
    }
  }

  // Update location
  static async update(id, updateData) {
    try {
      const location = await this.findById(id);
      if (!location) {
        throw new Error('Location not found');
      }

      // Check if update creates duplicate
      if (updateData.country || updateData.state || updateData.city || updateData.pincode) {
        const country = updateData.country || location.country;
        const state = updateData.state || location.state;
        const city = updateData.city || location.city;
        const pincode = updateData.pincode || location.pincode;
        
        const exists = await this.exists(country, state, city, pincode, id);
        if (exists) {
          throw new Error('Location already exists with these details');
        }
      }

      const fields = [];
      const params = [];

      const allowedFields = ['country', 'state', 'city', 'pincode', 'is_active', 'updated_by'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          if (field === 'country' || field === 'state' || field === 'city' || field === 'pincode') {
            params.push(updateData[field].trim());
          } else if (field === 'is_active') {
            params.push(updateData[field] ? 1 : 0);
          } else {
            params.push(updateData[field]);
          }
        }
      });

      if (fields.length === 0) {
        return location;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      const sql = `UPDATE locations SET ${fields.join(", ")} WHERE id = ?`;
      params.push(id);

      await query(sql, params);
      return await this.findById(id);
    } catch (error) {
      console.error(`Error in Location.update(${id}):`, error);
      throw error;
    }
  }

  // Delete location (soft delete)
  static async delete(id) {
    try {
      const location = await this.findById(id);
      if (!location) {
        throw new Error('Location not found');
      }

      await query(
        "UPDATE locations SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );
      return true;
    } catch (error) {
      console.error(`Error in Location.delete(${id}):`, error);
      throw error;
    }
  }

  // Toggle active status
  static async toggleActive(id) {
    try {
      const location = await this.findById(id);
      if (!location) {
        throw new Error('Location not found');
      }
      
      const newStatus = !location.is_active;
      await query(
        "UPDATE locations SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newStatus ? 1 : 0, id]
      );
      
      return await this.findById(id);
    } catch (error) {
      console.error(`Error in Location.toggleActive(${id}):`, error);
      throw error;
    }
  }

  // Get statistics (FIXED: Simple query)
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_locations,
          SUM(is_active = 1) as active_locations,
          SUM(is_active = 0) as inactive_locations,
          COUNT(DISTINCT country) as total_countries,
          COUNT(DISTINCT state) as total_states,
          COUNT(DISTINCT city) as total_cities
        FROM locations
      `);
      return stats[0];
    } catch (error) {
      console.error("Error in Location.getStats:", error);
      throw error;
    }
  }

  // Search locations (FIXED: Simple query)
  static async search(searchTerm) {
    try {
      const rows = await query(
        `
        SELECT * FROM locations 
        WHERE 
          country LIKE ? OR 
          state LIKE ? OR 
          city LIKE ? OR 
          pincode LIKE ?
        ORDER BY is_active DESC, country, state, city
        `,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows.map(row => this.normalizeRow(row));
    } catch (error) {
      console.error(`Error in Location.search(${searchTerm}):`, error);
      throw error;
    }
  }

  // Get unique countries (FIXED: Simple query)
  static async getCountries() {
    try {
      const rows = await query(
        `SELECT DISTINCT country FROM locations WHERE is_active = TRUE ORDER BY country`
      );
      return rows.map(row => row.country);
    } catch (error) {
      console.error("Error in Location.getCountries:", error);
      throw error;
    }
  }

  // Get states by country (FIXED: Simple query)
  static async getStatesByCountry(country) {
    try {
      const rows = await query(
        `SELECT DISTINCT state FROM locations WHERE country = ? AND is_active = TRUE ORDER BY state`,
        [country]
      );
      return rows.map(row => row.state);
    } catch (error) {
      console.error(`Error in Location.getStatesByCountry(${country}):`, error);
      throw error;
    }
  }

  // Get cities by state (FIXED: Simple query)
  static async getCitiesByState(state) {
    try {
      const rows = await query(
        `SELECT DISTINCT city FROM locations WHERE state = ? AND is_active = TRUE ORDER BY city`,
        [state]
      );
      return rows.map(row => row.city);
    } catch (error) {
      console.error(`Error in Location.getCitiesByState(${state}):`, error);
      throw error;
    }
  }

  // Get pincodes by city (FIXED: Simple query)
  static async getPincodesByCity(city) {
    try {
      const rows = await query(
        `SELECT DISTINCT pincode FROM locations WHERE city = ? AND is_active = TRUE ORDER BY pincode`,
        [city]
      );
      return rows.map(row => row.pincode);
    } catch (error) {
      console.error(`Error in Location.getPincodesByCity(${city}):`, error);
      throw error;
    }
  }

  // Normalize row data
  static normalizeRow(row) {
    if (!row) return row;
    row.is_active = Boolean(row.is_active);
    return row;
  }
}

module.exports = Location;