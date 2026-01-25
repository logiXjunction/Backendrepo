const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const {clientMiddleware } = require('../middlewares/authMiddleware')

router.post('/send-otp', clientController.sendOtp);
router.post('/verify-otp', clientController.verifyOtp);
router.post('/complete-profile',clientMiddleware,clientController.completeProfile)

// Protected route example
router.get('/me', clientMiddleware, (req, res) => {
  res.json(req.user);
});
router.get('/shipments',clientMiddleware, clientController.getMyShipments);
router.post('/accept-quote',clientMiddleware, clientController.acceptTransporterQuote);

module.exports = router;
