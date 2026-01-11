const express = require('express');
const upload = require('../middlewares/upload.middleware');
const { addDriver,getAllDrivers,getDriverDocument } = require('../controllers/driverController.js');

const {
  verifyJWT,
  requireTransporter,
  attachTransporter
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.post(
  '/add',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
    addDriver
);
router.get(
  '/all',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  getAllDrivers
);


router.get(
  '/:driverId/document/:type',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  getDriverDocument
);

module.exports = router;
