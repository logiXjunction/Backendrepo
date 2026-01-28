const router = require('express').Router();
const { sendOtp, getAvailableShipments, verifyOtp, registerTransporter, loginTransporter, getTransporterProfile, addCinNumber, updateOwnerName, addOwnerPhoneNumber, updateCustomerServiceNumber } = require('../controllers/transporterController.js');
const { verifyJWT,
  requireTransporter,
  attachTransporter
} = require('../middlewares/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerTransporter);
router.post('/login', loginTransporter);


router.post('/profile', verifyJWT, requireTransporter, attachTransporter, getTransporterProfile);
router.post('/add-cin-number', verifyJWT, requireTransporter, attachTransporter, addCinNumber);
router.post('/add-owner-name', verifyJWT, requireTransporter, attachTransporter, updateOwnerName);
router.post('/add-owner-phone', verifyJWT, requireTransporter, attachTransporter, addOwnerPhoneNumber);
router.post('/update-customer-service-number', verifyJWT, requireTransporter, attachTransporter, updateCustomerServiceNumber);
router.get(
  '/available-requests',
  verifyJWT,
  requireTransporter,
  getAvailableShipments
);

module.exports = router;
