const express = require('express');
const multer = require('multer'); // Import multer to use MulterError
const upload = require('../middlewares/upload.middleware');
const { verifyJWT, requireTransporter, attachTransporter } = require('../middlewares/authMiddleware');
const { addVehicle, getAllVehicles, getVehicleDocument } = require('../controllers/vehicleController');

const router = express.Router();

router.post(
    '/add',
    verifyJWT,
    requireTransporter,
    attachTransporter,
    (req, res, next) => {
        const multiUpload = upload.fields([
            { name: 'rc', maxCount: 1 },
            { name: 'roadPermit', maxCount: 1 },
            { name: 'pollution', maxCount: 1 }
        ]);

        multiUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File is too large. Max limit is 5MB.' });
                }
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            } else if (err) {
                // This catches the 'Invalid file type' error from your middleware's fileFilter
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },
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
