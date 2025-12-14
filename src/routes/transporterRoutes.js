const Transporter = require('../models/index.js');
const { redisClient } = require('../config/redis');
const jwt = require('jsonwebtoken');
const router = require('express').Router();


router.get('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const transporter = await Transporter.Transporter.findOne({ where: { email } });

        if (transporter) {
            return res.status(404).json({ success: false, message: 'Transporter already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        //check if otp exists for the email
        const existingOtp = await redisClient.get(`otp:${email}`);
        if (existingOtp) {
            return res.status(400).json({ success: false, message: 'OTP already sent. Please wait before requesting a new one.' });
        }
        await redisClient.setEx(`otp:${email}`, 600, otp);
        //sending otp to email using nodemailer
        
        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in /send-otp:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) {
            return res.status(400).json({ success: false, message: 'OTP has expired or is invalid' });
        }
        if (storedOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        // OTP is valid - delete it from Redis
        await redisClient.del(`otp:${email}`);
        //generate a token for further steps
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.status(200).json({ success: true, message: 'OTP verified successfully', token });
    } catch (error) {
        console.error('Error in /verify-otp:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, phoneNumber, designation, companyName, companyAddress, gstNumber } = req.body;
        const token1 = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token1, process.env.JWT_SECRET);
        if (decoded.email !== email) {
            return res.status(400).json({ success: false, message: 'Email mismatch' });
        }
        const newTransporter = await Transporter.Transporter.create({
            email,
            password,
            phoneNumber,
            designation,
            companyName,
            companyAddress,
            gstNumber
        });
        const token = jwt.sign(
            {
                id: newTransporter.id,
                email: newTransporter.email,
                companyName: newTransporter.companyName,
            },
            process.env.JWT_SECRET || "supersecretkey",
            { expiresIn: "7d" }
        );
        res.status(201).json({ success: true, message: 'Transporter registered successfully', transporterId: newTransporter.id, token });
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const transporter = await Transporter.findOne({ where: { email } });

        if (!transporter) {
            return res.status(404).json({ message: "Transporter not found" });
        }

        const isMatch = await transporter.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            {
                id: transporter.id,
                email: transporter.email,
                companyName: transporter.companyName,
            },
            process.env.JWT_SECRET || "supersecretkey",
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            transporter: {
                id: transporter.id,
                ownerName: transporter.ownerName,
                email: transporter.email,
                phoneNumber: transporter.phoneNumber,
                companyName: transporter.companyName,
                status: transporter.status,
                profileStatus: transporter.profileStatus
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



module.exports = router;
