const {Client} = require('../models/index');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { redisClient } = require('../config/redis');
const {Ftl} = require("../models/index");
const {Quotation} = require("../models/index");
const {Transporter} = require("../models/index");


const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

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
    const clientId = req.user.id; 

    // Validation: Only Name and Phone Number are strictly required now
    if (!name || !phoneNumber) {
      return res.status(400).json({ 
        message: 'Name and phone number are required to complete your profile.' 
      });
    }

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Update fields - others will be null/empty if not provided
    await client.update({
      name,
      phoneNumber,
      companyName: companyName || null,
      companyAddress: companyAddress || null,
      gstNumber: gstNumber || null,
      isProfileComplete: true, // Profile is now considered complete
    });

    return res.json({
      success: true,
      message: 'Profile completed successfully',
      client,
    });
  } catch (err) {
    console.error('Complete Profile Error:', err);
    return res.status(500).json({ message: 'Failed to complete profile' });
  }
};


/**
 * Fetch shipments for the logged-in client based on status
 * Matches the frontend tabs: requested, accepted, confirmed/ongoing, completed
 */
const getMyShipments = async (req, res) => {
  try {
    const { status } = req.query;
    const clientId = req.user.id; 
    console.log('i got called');

    const statusArray = status.includes(',') ? status.split(',') : [status];

    const shipments = await Ftl.findAll({
      where: {
        clientId: clientId,
        status: statusArray
      },
      include: [{ model: Quotation, as: 'quotes' }], 
      order: [['created_at', 'DESC']]
    });

    // We send it inside a 'data' object for standard practice
    return res.status(200).json({
      success: true,
      data: shipments 
    });
  } catch (error) {
    console.error("Fetch shipments error:", error);
    return res.status(500).json({ success: false, message: "Error fetching shipments" });
  }
};
const acceptTransporterQuote = async (req, res) => {
  const { shipmentId, quoteId } = req.body;
  const clientId = req.user.id;

  try {
    // 1. Find the shipment and the specific quote
    const shipment = await Ftl.findOne({ where: { id: shipmentId, clientId } });
    const quote = await Quotation.findOne({ where: { id: quoteId, FtlId: shipmentId } });

    if (!shipment || !quote) {
      return res.status(404).json({ message: "Shipment or Quote not found" });
    }

    // 2. Calculate final cost based on your Quotation schema
    const totalCost = 
      Number(quote.baseFreight) + 
      Number(quote.odaCharges) + 
      Number(quote.labourCharges) + 
      Number(quote.otherCharges);

    // 3. Update shipment status and final cost
    await shipment.update({
      status: 'accepted',
      transporterId : quote.transporterId

    });
    

    // 4. Mark the chosen quote as accepted
    await quote.update({ status: 'accepted' });

    // 5. (Optional) Reject other quotes automatically
    await Quotation.update(
      { status: 'rejected' },
      { where: { FtlId: shipmentId, status: 'pending' } }
    );

    return res.status(200).json({ 
      message: "Quote accepted. Please proceed to payment.",
      finalCost: totalCost 
    });
  } catch (error) {
    console.error("Accept quote error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports={
    sendOtp,
    verifyOtp,
    completeProfile,
    acceptTransporterQuote,
    getMyShipments,
}