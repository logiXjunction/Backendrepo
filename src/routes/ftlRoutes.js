const express = require('express');
const router = express.Router();
const ftlController = require('../controllers/serviceController'); // Adjust path as needed
const { tempFtlTokenCheck } = require('../middlewares/authMiddleware'); // Adjust path as needed

router.post('/create', tempFtlTokenCheck, ftlController.createFtlShipment);
router.post('/send-otp',ftlController.sendEmailOtp);
router.post('/verify-otp', ftlController.verifyEmailOtp);

module.exports = router;