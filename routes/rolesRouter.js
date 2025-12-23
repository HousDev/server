const express = require("express");
const roleRouter = express.Router();
const {
  getAllRoles,
  getRolePermissions,
  updateRolesPermissions,
} = require("../controllers/rolesController.js");

roleRouter.get("/", getAllRoles);
roleRouter.get("/:role/permissions", getRolePermissions);
roleRouter.put("/:roleId/permissions", updateRolesPermissions);
module.exports = roleRouter;
