// const express = require("express");
// const router = express.Router();
// const adminController = require("../controllers/adminController");
// const { authenticateAdmin } = require("../middlewares/authMiddleware");

// router.post("/sign-in", adminController.loginAdmin);
// router.get("/verify", adminController.verifyAdminToken);

// router.get("/get-transporters", authenticateAdmin, adminController.getTransporters);
// router.get("/get-clients", authenticateAdmin, adminController.getClients);
// router.get("/get-drivers", authenticateAdmin, adminController.getDrivers);



// module.exports = router; 

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateAdmin } = require("../middlewares/authMiddleware");
const devAdminBypass = require("../middlewares/devAdminBypass");

// 🔥 auto switch based on env
const adminAuth =
    process.env.NODE_ENV === "development"
        ? devAdminBypass
        : authenticateAdmin;

router.post("/sign-in", adminController.loginAdmin);
router.get("/verify", adminController.verifyAdminToken);

// ✅ admin access without JWT in dev
router.get("/get-transporters", adminAuth, adminController.getTransporters);
router.get("/get-clients", adminAuth, adminController.getClients);
router.get("/get-drivers", adminAuth, adminController.getDrivers);

module.exports = router;
