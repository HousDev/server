const express = require("express");
const router = express.Router();

const poController = require("../controllers/purchaseOrderController");
const poSeqController = require("../controllers/poSequenceController");

function bindRoute(method, path, handler, name) {
  if (typeof handler !== "function") {
    console.error(
      `Route handler ${name} for [${method.toUpperCase()} ${path}] is not a function.`,
      handler
    );
    throw new TypeError(
      `Route handler ${name} is not a function. Check controller export and require path.`
    );
  }
  router[method](path, handler);
}

bindRoute("post", "/", poController.createPO, "poController.createPO");

bindRoute("get", "/", poController.getPOs, "poController.getPOs");

// optional: next sequence endpoint
if (poSeqController && typeof poSeqController.next === "function") {
  bindRoute(
    "get",
    "/next-sequence",
    poSeqController.next,
    "poSeqController.next"
  );
} else {
  console.warn(
    "poSequenceController.next is not available as a route (you can still call nextNumber() internally)."
  );
}

router.put("/:poId", poController.updatePurchaseOrder);
router.delete("/:poId", poController.deletePurchaseOrder);
router.put("/updatePOStatus/:poId", poController.updatePurchaseOrderStatus);
router.get("/purchaseOrderItems", poController.getItemsOfPO);
router.delete(
  "/poItem/:poItemId/:poMaterialTrackingId",
  poController.deletePOItem
);

module.exports = router;
