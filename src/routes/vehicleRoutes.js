const express = require('express');
const upload = require('../middlewares/upload.middleware');
const {
  verifyJWT,
  requireTransporter,
  attachTransporter
} = require('../middlewares/authMiddleware');

const {
  addVehicle,
  getAllVehicles
} = require('../controllers/vehicleController');

const router = express.Router();

/**
 * POST /vehicles
 */
router.post(
  '/add',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  upload.fields([
    { name: 'rc', maxCount: 1 },
    { name: 'roadPermit', maxCount: 1 },
    { name: 'pollution', maxCount: 1 }
  ]),
  addVehicle
);

/**
 * GET /vehicles
 */
router.get(
  '/all',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  getAllVehicles
);

module.exports = router;
