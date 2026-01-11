const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Transporter = require("../models/transporter");
const Client = require("../models/client");
const Driver = require("../models/driver");


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




