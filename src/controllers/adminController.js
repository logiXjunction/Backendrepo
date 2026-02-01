const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const {
    processDocumentUrls,
    processDriverUrls,
    processVehicleUrls
} = require('../utils/s3Helper');
const {
    Transporter,
    Document,
    Driver,
    Vehicle,
    Ftl,
    Client,
    Coverage,
    Quotation
} = require('../models/index.js');
const { Op } = require("sequelize");

const JWT_SECRET = process.env.JWT_SECRET;

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required', email, password });
        }



        const admin = await Admin.findOne({ where: { email } });


        if (!admin) {

            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValid = await admin.comparePassword(password);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            token,
            message: "Login Succesfully "
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};

exports.verifyAdminToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                isValid: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if it's an admin token
        if (decoded.role !== 'admin') {
            return res.status(401).json({
                isValid: false,
                message: 'Token is not for admin user'
            });
        }

        // Optionally verify admin exists in database
        const admin = await Admin.findByPk(decoded.id);
        if (!admin) {
            return res.status(401).json({
                isValid: false,
                message: 'Admin no longer exists'
            });
        }

        return res.status(200).json({
            isValid: true,
            message: 'Token is valid for admin',
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: decoded.role
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                isValid: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                isValid: false,
                message: 'Token has expired'
            });
        }

        return res.status(500).json({
            isValid: false,
            message: 'Error verifying token',
            error: error.message
        });
    }
};


exports.getTransporters = async (req, res) => {
    try {
        const { id, role } = req.admin;


        const admin = await Admin.findByPk(id);
        if (!admin || role !== "admin") {
            return res.status(401).json({
                isValid: false,
                message: "Admin no longer exists"
            });
        }
        const { searchType, searchValue, status } = req.query;

        const where = {};

        // 🔍 Search
        if (searchValue) {
            if (searchType === "id") {
                where.id = searchValue;
            }
            if (searchType === "company") {
                where.companyName = { [Op.like]: `%${searchValue}%` };
            }
        }

        // ✅ Filter
        if (status) {
            where.status = status;
        }

        const transporters = await Transporter.findAll({
            where,
            order: [["createdAt", "DESC"]]
        });

        if (!transporters) {
            return res.status(401).json({
                isValid: false,
                message: "Transporter no longer exists"
            });
        }

        return res.status(200).json({
            isValid: true,
            count: transporters.length,
            data: transporters
        });

    } catch (error) {
        console.error("getTransporter error:", error);

        return res.status(500).json({
            isValid: false,
            message: "Internal server error"
        });
    }
};



exports.getClients = async (req, res) => {
    try {
        const { id, role } = req.admin;


        const admin = await Admin.findByPk(id);
        if (!admin || role !== "admin") {
            return res.status(401).json({
                isValid: false,
                message: "Admin no longer exists"
            });
        }

        const Clients = await Client.findAll({
            order: [["createdAt", "DESC"]]
        });
        if (!Clients) {
            return res.status(401).json({
                isValid: false,
                message: "Client no longer exists"
            });
        }

        return res.status(200).json({
            isValid: true,
            count: Clients.length,
            data: Clients
        });

    } catch (error) {
        console.error("getClient error:", error);

        return res.status(500).json({
            isValid: false,
            message: "Internal server error"
        });
    }
};


exports.getDrivers = async (req, res) => {
    try {
        const { id, role } = req.admin;

        const admin = await Admin.findByPk(id);
        if (!admin || role !== "admin") {
            return res.status(401).json({
                isValid: false,
                message: "Admin no longer exists"
            });
        }

        let drivers = await Driver.findAll();
        if (!drivers) {
            return res.status(401).json({
                isValid: false,
                message: "Driver no longer exists"
            });
        }
        drivers = await processDriverUrls(drivers);

        return res.status(200).json({
            isValid: true,
            count: drivers.length,
            data: drivers
        });

    } catch (error) {
        console.error("getDrivers error:", error);
        return res.status(500).json({
            isValid: false,
            message: "Internal server error"
        });
    }
};




exports.getTransporterById = async (req, res) => {
    try {
        const { id, role } = req.admin;

        // Authorization check
        if (role !== 'admin') {
            return res.status(403).json({
                isValid: false,
                message: 'Forbidden: Admin access required',
            });
        }

        const { transporterId } = req.params;

        // Validate transporterId
        if (!transporterId || isNaN(transporterId)) {
            return res.status(400).json({
                isValid: false,
                message: 'Invalid transporter ID',
            });
        }

        const transporter = await Transporter.findOne({
            where: { id: transporterId },
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Document,
                    required: false,
                },
                {
                    model: Driver,
                    required: false,
                },
                {
                    model: Vehicle,
                    required: false,
                },
                {
                    model: Coverage,
                    required: false,
                },
            ],
        });

        if (!transporter) {
            return res.status(404).json({
                isValid: false,
                message: 'Transporter not found',
            });
        }

        // Convert to plain object
        const transporterData = transporter.toJSON();

        // Process all document URLs in parallel
        const [processedDocument, processedDrivers, processedVehicles] = await Promise.all([
            processDocumentUrls(transporterData.Document),
            processDriverUrls(transporterData.Drivers),
            processVehicleUrls(transporterData.Vehicles),
        ]);

        // Update the data with signed URLs
        transporterData.Document = processedDocument;
        transporterData.Drivers = processedDrivers;
        transporterData.Vehicles = processedVehicles;

        return res.status(200).json({
            isValid: true,
            message: 'Transporter fetched successfully',
            data: transporterData,
        });

    } catch (error) {
        console.error('getTransporterById error:', error);
        return res.status(500).json({
            isValid: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};



exports.getDriverById = async (req, res) => {
    try {
        const { id, role } = req.admin;

        const admin = await Admin.findByPk(id);
        if (!admin || role !== 'admin') {
            return res.status(401).json({
                isValid: false,
                message: 'Unauthorized access',
            });
        }

        const { driverId } = req.params;
        
        // Fetch driver with associated transporter
        const driver = await Driver.findByPk(driverId, {
            include: [
                {
                    model: Transporter,
                    // as: 'transporter', // Make sure this association is defined in your models
                    attributes: [
                        'id',
                        'companyName',
                        'ownerName',
                        'ownerPhoneNumber',
                        'email',
                        'phoneNumber',
                        'companyAddress',
                        'gstNumber',
                        'cinNumber',
                        'customerServiceNumber',
                        'status',
                        'profileStatus',
                        'designation'
                    ]
                }
            ]
        });
        

        if (!driver) {
            return res.status(404).json({
                isValid: false,
                message: 'Driver not found',
            });
        }
        driverProcessed = await processDriverUrls([driver]);

        return res.status(200).json({
            isValid: true,
            message: 'Driver fetched successfully',
            data: driverProcessed[0],
        });

    } catch (error) {
        console.error('getDriverById error:', error);
        return res.status(500).json({
            isValid: false,
            message: 'Internal server error',
        });
    }
}



exports.getRequestedFtls = async (req, res) => {
    try {
        const { id, role } = req.admin;


        const admin = await Admin.findByPk(id);
        if (!admin || role !== 'admin') {
            return res.status(401).json({
                isValid: false,
                message: 'Unauthorized access',
            });
        }


        const ftls = await Ftl.findAll({
            where: { status: "requested" },
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: Client,
                    //   attributes: ["id", "name", "email", "phone"],
                    as: 'owner'
                },
            ],
        });

        res.status(200).json({
            success: true,
            count: ftls.length,
            data: ftls,
        });
    } catch (error) {
        console.error("Admin Requested FTL Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch requested FTLs",
        });
    }
};


exports.getPendingPaymentFtls = async (req, res) => {
    try {
        const ftls = await Ftl.findAll({
            where: {
                status: "accepted"
            },
            order: [["created_at", "DESC"]],
            attributes: [
                "id",
                "pickupCity",
                "deliveryCity",
                "weightKg",
                "transportMode",
                "shipmentType",
                "bodyType",
                "truckSize",
                "cost",
                "created_at"
            ],
            include: [
                {
                    model: Client,
                    as: 'owner',
                    attributes: ["id", "name", "email"]
                }
            ]
        });

        res.status(200).json({
            success: true,
            count: ftls.length,
            data: ftls
        });
    } catch (error) {
        console.error("Admin Pending Payment Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending payment FTLs"
        });
    }
};


exports.getActiveFtls = async (req, res) => {
    try {
        const ftls = await Ftl.findAll({
            where: {
                status: {
                    [Op.in]: ["confirmed", "ongoing", "completed"]
                }
            },
            order: [["updated_at", "DESC"]],
            attributes: [
                "id",
                "status",
                "pickupCity",
                "deliveryCity",
                "weightKg",
                "transportMode",
                "shipmentType",
                "bodyType",
                "truckSize",
                "cost",
                "updated_at"
            ],
            include: [
                {
                    model: Client,
                    as: 'owner',
                    attributes: ["id", "name", "email"]
                }
            ]
        });

        res.status(200).json({
            success: true,
            count: ftls.length,
            data: ftls
        });
    } catch (error) {
        console.error("Admin Active FTL Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch active FTLs"
        });
    }
};


exports.getFtlById = async (req, res) => {
    try {
        const { id, role } = req.admin;

        // Authorization check
        if (role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Admin access required',
            });
        }

        const { ftlId } = req.params;

        // Validate ftlId
        if (!ftlId || isNaN(ftlId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid FTL ID',
            });
        }

        const ftl = await Ftl.findOne({
            where: { id },
            include: [
                {
                    model: Client,
                    as: 'owner'
                },
                {
                    model: Quotation,
                    as: 'quotes',
                    include: [
                        {
                            model: Transporter,
                            as: 'transporter'
                        }
                    ]
                }
            ]
        });


        if (!ftl) {
            return res.status(404).json({
                success: false,
                message: 'FTL request not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'FTL request fetched successfully',
            data: ftl,
        });

    } catch (error) {
        console.error('getFtlById error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

