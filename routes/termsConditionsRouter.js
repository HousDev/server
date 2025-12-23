const express = require("express");
const {
  getAllTC,
  getTCById,
  createTCController,
  updateTCController,
  deleteTCController,
  getTCByIdVendorTermsConditions,
  updateIs_DefaultTCController,
} = require("../controllers/termsConditionsController");
const termsConditionsRouter = express.Router();
termsConditionsRouter.get("/", getAllTC);
termsConditionsRouter.get("/:id", getTCById);
termsConditionsRouter.get("/vendor/:id", getTCByIdVendorTermsConditions);
termsConditionsRouter.post("", createTCController);
termsConditionsRouter.put("/:id", updateTCController);
termsConditionsRouter.delete("/:id", deleteTCController);
termsConditionsRouter.put("/setIsDefault/:id", updateIs_DefaultTCController);

module.exports = termsConditionsRouter;
