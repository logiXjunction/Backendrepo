const express = require("express");
const router = express.Router();
const { saveCoverage, getCoverage } = require("../controllers/coverageController");
const {
    verifyJWT,
    requireTransporter,
    attachTransporter,
} = require('../middlewares/authMiddleware');


router.get("/", verifyJWT,
    requireTransporter,
    attachTransporter,
    getCoverage);

router.post("/", verifyJWT,
    requireTransporter,
    attachTransporter,
    saveCoverage);

module.exports = router;
