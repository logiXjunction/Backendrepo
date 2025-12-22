const router = require('express').Router();
const { sendOtp, verifyOtp, registerTransporter } = require('../controllers/transporterController');
const { loginTransporter, verify, updateProfile } = require('../controllers/transporterController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginTransporter);
router.post('/register', registerTransporter);
router.get('/verify', verify);
router.put('/profile', updateProfile);
module.exports = router;
