const router = require('express').Router();
const { sendOtp, verifyOtp, registerTransporter, loginTransporter } = require('../controllers/transporterController.js');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerTransporter);
router.post('/login', loginTransporter);

module.exports = router;
