const db = require("../config/db");

const CTCTemplateModel = {
  // =====================================================
  // CREATE TEMPLATE WITH COMPONENTS
  // =====================================================
  createTemplate: async ({ name, description, is_default, components }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1️⃣ Insert template
      const [templateResult] = await connection.execute(
        `INSERT INTO ctc_templates (name, description, is_default)
         VALUES (?, ?, ?)`,
        [name, description, is_default || false],
      );

      const templateId = templateResult.insertId;

      // 2️⃣ Insert components
      for (const item of components) {
        await connection.execute(
          `INSERT INTO ctc_template_components (
            template_id,
            component_name,
            component_type,
            value_type,
            value,
            calculation_base
          )
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            templateId,
            item.component_name,
            item.component_type,
            item.value_type,
            item.value || null,
            item.calculation_base || null,
          ],
        );
      }

      await connection.commit();
      return templateId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // =====================================================
  // UPDATE TEMPLATE + REPLACE COMPONENTS
  // =====================================================
  updateTemplate: async (
    template_id,
    { name, description, is_active, components },
  ) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1️⃣ Update template
      await connection.execute(
        `UPDATE ctc_templates
       SET name = ?, description = ?, is_active = ?
       WHERE id = ?`,
        [name, description, is_active, template_id],
      );

      // 2️⃣ Get existing components from DB
      const [existing] = await connection.execute(
        `SELECT id FROM ctc_template_components WHERE template_id = ?`,
        [template_id],
      );

      const existingIds = existing.map((e) => e.id);

      // ids coming from frontend
      const incomingIds = components.filter((c) => c.id).map((c) => c.id);

      // 3️⃣ DELETE removed components
      for (const oldId of existingIds) {
        if (!incomingIds.includes(oldId)) {
          await connection.execute(
            `DELETE FROM ctc_template_components WHERE id = ?`,
            [oldId],
          );
        }
      }

      // 4️⃣ Update or Insert
      for (const item of components) {
        if (item.id) {
          // update
          await connection.execute(
            `UPDATE ctc_template_components
           SET component_name = ?,
               component_type = ?,
               value_type = ?,
               value = ?,
               calculation_base = ?
           WHERE id = ?`,
            [
              item.component_name,
              item.component_type,
              item.value_type,
              item.value || null,
              item.calculation_base || null,
              item.id,
            ],
          );
        } else {
          // insert new
          await connection.execute(
            `INSERT INTO ctc_template_components (
            template_id,
            component_name,
            component_type,
            value_type,
            value,
            calculation_base
          )
          VALUES (?, ?, ?, ?, ?, ?)`,
            [
              template_id,
              item.component_name,
              item.component_type,
              item.value_type,
              item.value || null,
              item.calculation_base || null,
            ],
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // =====================================================
  // GET FULL TEMPLATE
  // =====================================================
  getTemplate: async (template_id) => {
    const [templates] = await db.execute(
      `SELECT *
       FROM ctc_templates
       WHERE id = ?`,
      [template_id],
    );

    if (templates.length === 0) return null;

    const [components] = await db.execute(
      `SELECT *
       FROM ctc_template_components
       WHERE template_id = ?
         AND is_active = TRUE
       ORDER BY id`,
      [template_id],
    );

    return {
      ...templates[0],
      components,
    };
  },

  // =====================================================
  // GET ALL TEMPLATES
  // =====================================================
  getAllTemplates: async () => {
    const [rows] = await db.execute(
      `SELECT *
       FROM ctc_templates
       ORDER BY id DESC`,
    );
    return rows;
  },

  // =====================================================
  // DELETE TEMPLATE
  // =====================================================
  deleteTemplate: async (template_id) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // delete components
      await connection.execute(
        `DELETE FROM ctc_template_components WHERE template_id = ?`,
        [template_id],
      );

      // delete template
      await connection.execute(`DELETE FROM ctc_templates WHERE id = ?`, [
        template_id,
      ]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = CTCTemplateModel;
