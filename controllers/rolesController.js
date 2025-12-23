const { findAll, findById, update } = require("../models/rolesModel");
const getAllRoles = async (req, res) => {
  try {
    const allRoles = await findAll();

    return res.status(200).json({ data: allRoles, status: "fullfiled" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error.", error: error });
  }
};

const getRolePermissions = async (req, res) => {
  const { role } = req.params;
  const rolePermissions = await findById(role);
  return res.status(200).json({
    message: "roles permissions fetched.",
    permissions: rolePermissions[0].permissions,
  });
};

async function updateRolesPermissions(req, res) {
  try {
    const { roleId } = req.params;
    const existing = await findById(roleId);
    if (!existing) return res.status(404).json({ error: "Role not found" });

    const { permissions } = req.body;

    const updated = await update(roleId, permissions);

    res.json({ message: "Role updated successfully.", data: updated });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
}

module.exports = {
  getAllRoles,
  getRolePermissions,
  updateRolesPermissions,
};
