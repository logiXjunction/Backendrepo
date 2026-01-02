const express = require('express');
const upload = require('../middlewares/upload.middleware');
const {
  verifyJWT,
  requireTransporter,
  attachTransporter,
} = require('../middlewares/authMiddleware');

const {
  submitDocument,
  getDocuments,
  getDocumentUrl,
} = require('../controllers/documentController');

const router = express.Router();

// Get all documents for a transporter
router.get(
  '/',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  getDocuments
);

// Submit a single document independently - format: /add-{key}
router.post(
  '/add-:key',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  upload.single('file'),
  submitDocument
);

// Get S3 signed URL for a specific document
router.get(
  '/:key',
  verifyJWT,
  requireTransporter,
  attachTransporter,
  getDocumentUrl
);

module.exports = router;

