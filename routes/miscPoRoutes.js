// routes/miscPoRoutes.js
const express = require("express");
const router = express.Router();

// require controllers
const seqController = require("../controllers/poSequenceController");
const trackController = require("../controllers/poTrackingController");

// helper to ensure function
function useIfFunction(fn, fallbackName) {
  if (typeof fn === "function") return fn;
  // return a placeholder that responds with helpful error instead of crashing
  return (req, res) => {
    console.error(
      `Route handler ${fallbackName} is not a function. Check controller export and require path.`
    );
    res
      .status(500)
      .json({ message: `Server route handler misconfigured: ${fallbackName}` });
  };
}

// Register routes (safe)
router.post(
  "/po-sequences/next",
  useIfFunction(seqController.next, "poSequenceController.next")
);
router.post(
  "/po-material-tracking",
  useIfFunction(
    trackController.createTracking,
    "poTrackingController.createTracking"
  )
);
router.post(
  "/po-payments",
  useIfFunction(
    trackController.createPayment,
    "poTrackingController.createPayment"
  )
);

module.exports = router;
