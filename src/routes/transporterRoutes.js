const router = require('express').Router();
const { sendOtp } = require('../controllers/transporterController.js');

router.post('/send-otp', sendOtp);

module.exports = router;
