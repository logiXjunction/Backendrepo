const router = require('express').Router();
const multer = require('multer');
const upload = multer(); // memory storage
const { createPackersRequest, createPtlRequest } = require('../controllers/servicesController');

// POST /api/services/packers
router.post('/packers', upload.array('images', 6), createPackersRequest);

// POST /api/services/ptl  -> used when PTL selected (simple lead: name + phone)
router.post('/ptl', createPtlRequest);

module.exports = router;
