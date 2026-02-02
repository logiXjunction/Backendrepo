const router = require('express').Router();
const { verifyJWT,
  requireTransporter,
  attachTransporter
} = require('../middlewares/authMiddleware');
const { submitQuotation } = require('../controllers/QuotationController')

router.post('/submit', verifyJWT, requireTransporter, attachTransporter, submitQuotation)

module.exports = router