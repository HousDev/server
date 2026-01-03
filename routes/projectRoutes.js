const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");

// Project CRUD routes
router.post("/", projectController.createProject); // Create project with hierarchy
router.get("/", projectController.getAllProjects); // Get all projects
router.get("/:projectId", projectController.getProject); // Get project with hierarchy
router.put("/:projectId", projectController.updateProjectHierarchy); // Full hierarchy update
router.delete("/:projectId", projectController.deleteProject); // Delete project

module.exports = router;

// // routes/projectRoutes.js
// const express = require("express");
// const router = express.Router();

// const projectController = require("../controllers/projectController");

// function bindRoute(method, path, handler, name) {
//   if (typeof handler !== "function") {
//     console.error(
//       `Route handler ${name} for [${method.toUpperCase()} ${path}] is not a function.`,
//       handler
//     );
//     throw new TypeError(
//       `Route handler ${name} is not a function. Check controller export and require path.`
//     );
//   }
//   router[method](path, handler);
// }

// // list & create
// bindRoute(
//   "get",
//   "/",
//   projectController.getProjects,
//   "projectController.getProjects"
// );
// bindRoute(
//   "post",
//   "/",
//   projectController.createProject,
//   "projectController.createProject"
// );

// // get/update/delete by id
// bindRoute(
//   "get",
//   "/:id",
//   projectController.getProjectById,
//   "projectController.getProjectById"
// );
// bindRoute(
//   "patch",
//   "/:id",
//   projectController.updateProject,
//   "projectController.updateProject"
// );
// bindRoute(
//   "put",
//   "/:id",
//   projectController.updateProject,
//   "projectController.updateProject"
// );
// bindRoute(
//   "delete",
//   "/:id",
//   projectController.deleteProject,
//   "projectController.deleteProject"
// );

// module.exports = router;
