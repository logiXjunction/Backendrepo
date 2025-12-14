const Transporter = require("../models/transporter");
const Vehicle = require("../models/vehicle");
const { redisClient } = require('../config/redis');

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const transporter = await Transporter.findOne({ where: { email } });

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
}


module.exports = {
    sendOtp,
};