const Transporter = require("../models/transporter");
const { redisClient } = require("../config/redis");
const { nodemailerTransporter } = require("../config/nodemailer");

// -------------------- HELPERS --------------------
const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

// -------------------- SEND OTP --------------------
exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

        const existingUser = await Transporter.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Transporter already exists",
            });
        }

        const otp = generateOtp();

        // prevent spamming
        const existingOtp = await redisClient.get(`otp:${email}`);
        if (existingOtp) {
            return res.status(400).json({
                success: false,
                message: "OTP already sent. Please wait.",
            });
        }

        await redisClient.setEx(`otp:${email}`, 300, otp);

        await nodemailerTransporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: "Your OTP - LogixJunction",
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        });

        return res.json({
            success: true,
            message: "OTP sent successfully",
        });
    } catch (err) {
        console.error("Send OTP error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// -------------------- VERIFY OTP --------------------
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP required",
            });
        }

        const savedOtp = await redisClient.get(`otp:${email}`);

        if (!savedOtp || savedOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        await redisClient.del(`otp:${email}`);
        await redisClient.setEx(`verified:${email}`, 600, "true");

        return res.json({
            success: true,
            message: "OTP verified successfully",
        });
    } catch (err) {
        console.error("Verify OTP error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// -------------------- REGISTER TRANSPORTER --------------------
exports.registerTransporter = async (req, res) => {
    try {
        const {
            email,
            ownerName,
            phone,
            companyName,
        } = req.body;

        // ✅ REQUIRED FIELD CHECK (prevents 500)
        if (!email || !ownerName || !phone || !companyName) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // ✅ OTP VERIFIED CHECK
        const isVerified = await redisClient.get(`verified:${email}`);
        if (!isVerified) {
            return res.status(401).json({
                success: false,
                message: "OTP not verified",
            });
        }

        const transporter = await Transporter.create({
            email,
            ownerName,
            phone,
            companyName,
        });

        // cleanup
        await redisClient.del(`verified:${email}`);

        // generate onboarding token
        const jwt = require('jsonwebtoken');
        const onboardingToken = jwt.sign({ id: transporter.id, email: transporter.email, userType: 'transporter', onboarding: true }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({
            success: true,
            message: "Transporter registered successfully",
            data: { id: transporter.id, email: transporter.email, onboardingToken },
        });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// -------------------- TRANSPORTER LOGIN --------------------
exports.loginTransporter = async (req, res) => {
    try {
        const { email, mobileNumber, password } = req.body;
        if (!password || (!email && !mobileNumber)) {
            return res.status(400).json({ success: false, message: 'Email or mobileNumber and password are required' });
        }

        const where = email ? { email } : { phoneNumber: mobileNumber };
        const user = await Transporter.findOne({ where });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user.id, email: user.email, userType: 'transporter' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({ success: true, message: 'Login successful', token, profile: { id: user.id, email: user.email, companyName: user.companyName } });
    } catch (err) {
        console.error('loginTransporter error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Verify transporter token
exports.verify = async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const token = auth.split(' ')[1];
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        if (decoded.userType !== 'transporter') {
            return res.status(403).json({ success: false, message: 'Invalid user type' });
        }
        const user = await Transporter.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, transporterProfile: user });
    } catch (err) {
        console.error('verify error:', err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Update transporter profile
exports.updateProfile = async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const token = auth.split(' ')[1];
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        if (decoded.userType !== 'transporter') {
            return res.status(403).json({ success: false, message: 'Invalid user type' });
        }

        const user = await Transporter.findByPk(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { ownerName, phone, companyName, companyAddress, designation, gstNumber, password } = req.body;

        await user.update({
            ownerName: ownerName || user.ownerName,
            ownerPhoneNumber: phone || user.ownerPhoneNumber,
            companyName: companyName || user.companyName,
            companyAddress: companyAddress || user.companyAddress,
            designation: designation || user.designation,
            gstNumber: gstNumber || user.gstNumber,
            password: password || user.password,
        });

        return res.json({ success: true, message: 'Profile updated', profile: { id: user.id, ownerName: user.ownerName, email: user.email, companyName: user.companyName } });
    } catch (err) {
        console.error('updateProfile error:', err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};