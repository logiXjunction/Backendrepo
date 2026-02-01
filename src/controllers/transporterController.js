const Transporter = require("../models/transporter");
const Vehicle = require("../models/vehicle");
const { redisClient } = require('../config/redis');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Quotation = require('../models/quotation')
const mailTransporter = nodemailer.createTransport({
    secure:false,
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls:{
        rejectUnauthorized:false,
    }
});

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if email already exists in database
        const existingTransporter = await Transporter.findOne({ where: { email } });
        if (existingTransporter) {
            return res.status(409).json({ message: 'Email Already Exists in Database' });
        }

        // Check if OTP already exists for this email (rate limiting)
        const existingOtp = await redisClient.get(`otp:${email}`);
        if (existingOtp) {
            return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Redis with 5-minute (300 seconds) expiry
        await redisClient.setEx(`otp:${email}`, 300, otp);

        // Send OTP via email using nodemailer (skip in development if no credentials)
        if (process.env.NODE_ENV === 'development' &&
            (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-gmail@gmail.com')) {
            console.log(`\n📧 [DEV MODE] OTP for ${email}: ${otp}\n`);
        } else {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP for LogiX Junction Registration',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">LogiX Junction - Email Verification</h2>
                        <p>Your OTP for registration is:</p>
                        <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
                        <p>If you did not request this OTP, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #888; font-size: 12px;">This is an automated message. Please do not reply.</p>
                    </div>
                `,
            };
            await mailTransporter.sendMail(mailOptions);
        }

        res.status(200).json({ message: `OTP sent successfully to ${email}` });
    } catch (error) {
        console.error('Error in /send-otp:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Get stored OTP from Redis
        const storedOtp = await redisClient.get(`otp:${email}`);

        // Check if OTP has expired (not found in Redis)
        if (!storedOtp) {
            return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Check if OTP matches
        if (storedOtp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP is valid - delete it from Redis
        await redisClient.del(`otp:${email}`);

        // Generate JWT token valid for 10 minutes
        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error in /verify-otp:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

const registerTransporter = async (req, res) => {
    try {
        const { email, password, companyName, companyAddress, designation, gstNumber, phoneNumber } = req.body;

        // Validate required fields
        if (!email || !password || !companyName || !companyAddress || !designation || !gstNumber || !phoneNumber) {
            return res.status(400).json({
                message: 'Missing required fields. Please provide email, password, companyName, companyAddress, designation, gstNumber, and phoneNumber.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        // Validate password strength (minimum 8 characters)
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }

        // Validate GST number format
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(gstNumber)) {
            return res.status(400).json({ message: 'Invalid GST number format.' });
        }

        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized access. Please provide valid credentials.' });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized access. Please provide valid credentials.' });
        }

        // Match email in token with email in request body
        if (decoded.email !== email) {
            return res.status(401).json({ message: 'Unauthorized access. Please provide valid credentials.' });
        }

        // Check if transporter already exists
        const existingTransporter = await Transporter.findOne({ where: { email } });
        if (existingTransporter) {
            return res.status(400).json({ message: 'Transporter with this email already exists.' });
        }

        // Create new transporter (password is hashed by beforeCreate hook in model)
        await Transporter.create({
            email,
            password,
            companyName,
            companyAddress,
            designation,
            gstNumber,
            phoneNumber,
        });

        res.status(201).json({ message: 'Transporter registered successfully.' });
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const loginTransporter = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find transporter by email
        const transporter = await Transporter.findOne({ where: { email } });
        if (!transporter) {
            return res.status(401).json({ message: 'Unauthorized access. Please provide valid credentials.' });
        }

        // Compare password using model's instance method
        const isPasswordValid = await transporter.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Unauthorized access. Please provide valid credentials.' });
        }

        // Generate JWT token valid for 7 days
        // Includes role as 'transporter', email, and id
        const token = jwt.sign(
            {
                id: transporter.id,
                email: transporter.email,
                role: 'transporter'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            message: 'Login successful.'
        });
    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
    }
}
const getTransporterProfile = async (req, res) => {
    try {
        const transporterId = req.transporter.id;
        const transporter = await Transporter.findByPk(transporterId, {
            attributes: { exclude: ['password'] } // Exclude password from response
        });
        if (!transporter) {
            return res.status(404).json({ message: 'Transporter not found.' });
        }
        res.status(200).json({ transporter });
    } catch (error) {
        console.error('Error fetching transporter profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const addCinNumber = async (req, res) => {
    try {
        const transporterId = req.transporter.id;
        const { cinNumber } = req.body;
        if (!cinNumber) {
            return res.status(400).json({ message: 'CIN number is required.' });
        }
        const transporter = await Transporter.findByPk(transporterId);
        if (!transporter) {
            return res.status(404).json({ message: 'Transporter not found.' });
        }
        if (transporter.cinNumber) {
            return res.status(400).json({ message: 'CIN number is already set and cannot be updated.' });
        }
        transporter.cinNumber = cinNumber;
        await transporter.save();
        res.status(200).json({ message: 'CIN number updated successfully.' });
    } catch (error) {
        console.error('Error updating CIN number:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateOwnerName = async (req, res) => {
    try {
        const transporterId = req.transporter.id;
        const { ownerName } = req.body;
        if (!ownerName) {
            return res.status(400).json({ message: 'Owner name is required.' });
        }
        const transporter = await Transporter.findByPk(transporterId);
        if (!transporter) {
            return res.status(404).json({ message: 'Transporter not found.' });
        }
        transporter.ownerName = ownerName;
        await transporter.save();
        res.status(200).json({ message: 'Owner name updated successfully.' });
    } catch (error) {
        console.error('Error updating owner name:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const addOwnerPhoneNumber = async (req, res) => {
    try {
        const transporterId = req.transporter.id;
        const { ownerPhoneNumber } = req.body;
        if (!ownerPhoneNumber) {
            return res.status(400).json({ message: 'Owner phone number is required.' });
        }
        const transporter = await Transporter.findByPk(transporterId);
        if (!transporter) {
            return res.status(404).json({ message: 'Transporter not found.' });
        }
        if (transporter.ownerPhoneNumber) {
            return res.status(400).json({ message: 'Owner phone number is already set and cannot be updated.' });
        }
        transporter.ownerPhoneNumber = ownerPhoneNumber;
        await transporter.save();
        res.status(200).json({ message: 'Owner phone number updated successfully.' });
    } catch (error) {
        console.error('Error updating owner phone number:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
const updateCustomerServiceNumber = async (req, res) => {
    try {
        const transporterId = req.transporter.id;
        const { customerServiceNumber } = req.body;
        if (!customerServiceNumber) {
            return res.status(400).json({ message: 'Customer service number is required.' });
        }
        const transporter = await Transporter.findByPk(transporterId);
        if (!transporter) {
            return res.status(404).json({ message: 'Transporter not found.' });
        }
        transporter.customerServiceNumber = customerServiceNumber;
        await transporter.save();
        res.status(200).json({ message: 'Customer service number updated successfully.' });
    } catch (error) {
        console.error('Error updating customer service number:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
const { Ftl, Client } = require('../models');

/**
 * Get all available FTL shipments for Transporters
 * Filters for status: 'requested'
 */
const getAvailableShipments = async (req, res, next) => {
    try {
        const transporterId = req.transporter.id;

        // 1. Get IDs of shipments this transporter has already quoted
        const quotedShipmentIds = await Quotation.findAll({
            where: { transporterId },
            attributes: ['FtlId'],
            raw: true
        }).then(quotes => quotes.map(q => q.shipmentId));

        // 2. Find shipments where status is 'requested' AND ID is not in quotedShipmentIds
        const shipments = await Ftl.findAll({
            where: {
                status: 'requested',
                id: {
                    [Op.notIn]: quotedShipmentIds
                }
            },
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: shipments.length,
            data: shipments
        });
    } catch (error) {
        console.error('Error fetching available shipments:', error);
        next(error);
    }
}; module.exports = {
    sendOtp,
    verifyOtp,
    registerTransporter,
    loginTransporter,
    getTransporterProfile,
    addCinNumber,
    updateOwnerName,
    addOwnerPhoneNumber,
    updateCustomerServiceNumber,
    getAvailableShipments
};