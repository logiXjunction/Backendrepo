const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const {clientMiddleware } = require('../middlewares/authMiddleware')

router.post('/send-otp', clientController.sendOtp);
router.post('/verify-otp', clientController.verifyOtp);

// Protected route example
router.get('/me', clientMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
