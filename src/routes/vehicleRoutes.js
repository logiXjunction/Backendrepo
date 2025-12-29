const express = require('express');
const upload = require('../middlewares/upload.middleware');
const {
    verifyJWT,
    requireTransporter,
    attachTransporter
} = require('../middlewares/authMiddleware');

const {
    addVehicle,
    getAllVehicles,
    getVehicleDocument
} = require('../controllers/vehicleController');

const router = express.Router();

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

router.get(
    '/all',
    verifyJWT,
    requireTransporter,
    attachTransporter,
    getAllVehicles
);


router.get(
    '/:vehicleId/document/:type',
    verifyJWT,
    requireTransporter,
    attachTransporter,
    getVehicleDocument
);

module.exports = router;
