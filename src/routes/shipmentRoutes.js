const router = require('express').Router();
const multer = require('multer');
const upload = multer();
const { createFtlShipment } = require('../controllers/shipmentController');

// Use multer().none() to parse multipart/form-data form fields (no file uploads expected here)
router.post('/create', upload.none(), createFtlShipment);

module.exports = router;
