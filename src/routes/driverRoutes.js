const express = require('express');
const upload = require('../middlewares/upload.middleware');
const { addDriver,getAllDrivers,getDriverDocument } = require('../controllers/driverController.js');
const multer = require('multer'); // Import multer to use MulterError

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
  (req, res, next) => {
    const driverUpload = upload.fields([
      { name: 'aadhar', maxCount: 1 },
      { name: 'license', maxCount: 1 },
      { name: 'photo', maxCount: 1 }
    ]);

    driverUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Driver docs error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
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
