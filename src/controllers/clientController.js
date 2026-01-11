const Client = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { redisClient } = require('../config/redis');

const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const sendOTPEmail = async (email, otp) => {
    await mailTransporter.sendMail({
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Login OTP',
        html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 5 minutes.</p>
    `,
    });
};

/* ------------------------------------------------------------------ */
/* CONTROLLERS */
/* ------------------------------------------------------------------ */
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email)
            return res.status(400).json({ message: 'Email is required' });

        const otp = generateOTP();

        // Save OTP in Redis
        await redisClient.set(
            `otp:${email}`,
            otp,
            { EX: OTP_EXPIRY_SECONDS }
        );

        await sendOTPEmail(email, otp);

        return res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error('Send OTP Error:', err);
        return res.status(500).json({ message: 'Failed to send OTP' });
    }
};

/**
 * VERIFY OTP + LOGIN / SIGNUP
 * POST /auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const storedOtp = await redisClient.get(`otp:${email}`);

    if (!storedOtp || storedOtp !== otp)
      return res.status(401).json({ message: 'Invalid or expired OTP' });

    let client = await Client.findOne({ where: { email } });

    let isNewUser = false;

    if (!client) {
      client = await Client.create({ email });
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: client.id, email: client.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await redisClient.del(`otp:${email}`);

    return res.json({
      message: 'Authentication successful',
      token,
      isNewUser,
      isProfileComplete: client.isProfileComplete,
    });

  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ message: 'OTP verification failed' });
  }
};

const completeProfile = async (req, res) => {
  try {
    const { name, phoneNumber, companyName, companyAddress, gstNumber } = req.body;
    const clientId = req.user.id; // from JWT middleware

    if (!name || !phoneNumber)
      return res.status(400).json({ message: 'Name and phone number are required' });

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    await client.update({
      name,
      phoneNumber,
      companyName,
      companyAddress,
      gstNumber,
      isProfileComplete: true,
    });

    return res.json({
      message: 'Profile completed successfully',
      client,
    });
  } catch (err) {
    console.error('Complete Profile Error:', err);
    return res.status(500).json({ message: 'Failed to complete profile' });
  }
};


module.exports={
    sendOtp,
    verifyOtp,
    completeProfile
}