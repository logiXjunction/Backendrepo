const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const adminDocumentController = require("../controllers/adminDocumentController");
const { authenticateAdmin } = require("../middlewares/authMiddleware");

// -------- AUTH --------
router.post("/sign-in", adminController.loginAdmin);
router.get("/verify", adminController.verifyAdminToken);

// -------- ADMIN DATA --------
router.get("/get-transporters", authenticateAdmin, adminController.getTransporters);
router.get("/get-clients", authenticateAdmin, adminController.getClients);
router.get("/get-drivers", authenticateAdmin, adminController.getDrivers);

router.get("/get-transporter/:transporterId", authenticateAdmin, adminController.getTransporterById);
router.get("/get-driver/:driverId", authenticateAdmin, adminController.getDriverById);

router.get("/get-requested-ftls", authenticateAdmin, adminController.getRequestedFtls);
router.get("/pending-payment-ftls", authenticateAdmin, adminController.getPendingPaymentFtls);
router.get("/get-active-ftls", authenticateAdmin, adminController.getActiveFtls);
router.get("/ftl/:ftlId", authenticateAdmin, adminController.getFtlById);

// -------- DOCUMENTS --------
router.post(
    "/documents/:transporterId/:docKey/approve",
    authenticateAdmin,
    adminDocumentController.approveDocument
);

router.post(
    "/documents/:transporterId/:docKey/reject",
    authenticateAdmin,
    adminDocumentController.rejectDocument
);

router.get(
    "/documents/:transporterId/:docKey",
    authenticateAdmin,
    adminDocumentController.getAdminDocumentUrl
);

router.patch(
    "/documents/:transporterId/status",
    authenticateAdmin,
    adminController.updateDocumentStatus
);

module.exports = router;
