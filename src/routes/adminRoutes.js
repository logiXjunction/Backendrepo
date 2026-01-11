const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/authMiddleware');

router.post('/sign-in', adminController.loginAdmin);
router.get('/verify', adminController.verifyAdminToken);
router.get("/get-transporters",authenticateAdmin,adminController.getTransporters);
router.get("/get-clients",authenticateAdmin,adminController.getClients);
router.get("/get-drivers",authenticateAdmin,adminController.getDrivers);



module.exports = router; 