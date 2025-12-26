// controllers/userController.js
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const UserModel = require("../models/userModel");
const { create, findByName } = require("../models/rolesModel");

const scrub = (user) => {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  return copy;
};

async function getAllUsers(req, res) {
  try {
    const users = await UserModel.findAll();
    res.json(users.map(scrub));
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function getUserById(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(scrub(user));
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

async function createUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      email,
      full_name,
      phone,
      role,
      department,
      password,
      is_active = true,
      permissions = {},
    } = req.body;

    const existing = await UserModel.findByEmailWithPassword(email);
    if (existing)
      return res
        .status(400)
        .json({ error: "A user with this email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const created = await UserModel.create({
      email,
      full_name,
      phone,
      role,
      department,
      passwordHash: hash,
      is_active,
      permissions,
    });

    const existingRole = await findByName(role);

    if (!existingRole) {
      await create({ name: role, permissions });
    }

    res.status(201).json(scrub(created));
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
}

async function updateUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const existing = await UserModel.findById(id);
    if (!existing) return res.status(404).json({ error: "User not found" });

    const {
      full_name,
      phone,
      role,
      department,
      password,
      is_active,
      permissions,
    } = req.body;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const updated = await UserModel.update(id, {
      full_name,
      phone,
      role,
      department,
      passwordHash,
      is_active,
      permissions,
    });

    res.json(scrub(updated));
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const existing = await UserModel.findById(id);
    if (!existing) return res.status(404).json({ error: "User not found" });

    await UserModel.remove(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

async function toggleActive(req, res) {
  try {
    const { id } = req.params;
    const user = await UserModel.toggleActive(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(scrub(user));
  } catch (err) {
    console.error("toggleActive error:", err);
    res.status(500).json({ error: "Failed to toggle active" });
  }
}

const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    // userId, permissions);
    if (!userId || !permissions) {
      return res.status(400).json({ message: "All data fields required." });
    }
    const existing = await UserModel.findById(userId);
    if (!existing) {
      return res.status(404).json({ message: "User not found." });
    }
    const user = await UserModel.updateUserPermissions(userId, permissions);
    return res
      .status(200)
      .json({ message: "User Permissions Updated.", data: user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  updateUserPermissions,
};
