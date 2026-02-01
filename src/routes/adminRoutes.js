const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/authMiddleware');

router.post('/sign-in', adminController.loginAdmin);
router.get('/verify', adminController.verifyAdminToken);
router.get("/get-transporters",authenticateAdmin,adminController.getTransporters);
router.get("/get-clients",authenticateAdmin,adminController.getClients);
router.get("/get-drivers",authenticateAdmin,adminController.getDrivers);
router.get("/get-transporter/:transporterId",authenticateAdmin,adminController.getTransporterById);
router.get("/get-driver/:driverId",authenticateAdmin,adminController.getDriverById);
router.get("/get-requested-ftls",authenticateAdmin,adminController.getRequestedFtls);
router.get("/pending-payment-ftls", authenticateAdmin,adminController.getPendingPaymentFtls);
router.get("/get-active-ftls",authenticateAdmin,adminController.getActiveFtls);
router.get('/ftl/:ftlId', authenticateAdmin, adminController.getFtlById);

module.exports = router; 