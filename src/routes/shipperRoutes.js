const router = require('express').Router();
const { registerShipper, loginShipper, verify, updateProfile } = require('../controllers/shipperController');

router.post('/register', registerShipper);
router.post('/login', loginShipper);
router.get('/verify', verify);
router.put('/profile', updateProfile);

module.exports = router;
