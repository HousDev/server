const {
  findAll,
  findById,
  findByName,
  create,
  update,
  remove,
} = require("../models/projectDetailsModel");

/**
 * GET all project details
 */
const getAllProjectDetails = async (req, res) => {
  try {
    const data = await findAll();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch data" });
  }
};

/**
 * GET project detail by ID
 */
const getProjectDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await findById(id);

    if (!data) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch record" });
  }
};

/**
 * CREATE project detail
 */
const createProjectDetails = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.name || !payload.category) {
      return res.status(400).json({ message: "All fields required." });
    }

    // check unique name
    const existing = await findByName(payload.name);
    if (existing) {
      return res.status(400).json({ message: "Name already exists." });
    }

    const result = await create(payload);

    return res.status(201).json({
      message: "Project detail created successfully",
      status: "completed",
      id: result.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create record" });
  }
};

/**
 * UPDATE project detail
 */
const updateProjectDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!id || !payload.name || !payload.category) {
      return res.status(400).json({ message: "All fields required." });
    }

    // check record exists
    const existing = await findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Record not found" });
    }

    // optional: prevent duplicate name on update
    const nameExists = await findByName(payload.name);
    if (nameExists && nameExists.id !== Number(id)) {
      return res.status(400).json({ message: "Name already exists." });
    }

    await update(id, payload);

    return res
      .status(200)
      .json({ message: "Updated successfully", status: "completed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update record" });
  }
};

/**
 * DELETE project detail
 */
const deleteProjectDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await remove(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res
      .status(200)
      .json({ message: "Deleted successfully", status: "completed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete record" });
  }
};

module.exports = {
  getAllProjectDetails,
  getProjectDetailsById,
  createProjectDetails,
  updateProjectDetails,
  deleteProjectDetails,
};
