const { Client, Ftl } = require('../models');
const crypto = require('crypto');
const { redisClient } = require('../config/redis');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const resend = require('../config/resend');

let mailTransporter;

if (process.env.NODE_ENV === 'development') {
  mailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });
}
const sendEmailOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    email = email.toLowerCase().trim();

    // Rate limit OTP
    const existingOtp = await redisClient.get(`otp:${email}`);
    if (existingOtp) {
      return res.status(429).json({
        message: 'Too many OTP requests. Please try again later.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP for 5 minutes
    await redisClient.set(`otp:${email}`, otp, { EX: 300 });

    const subject = 'Verify your email';
    const html = `
      <div style="font-family: Arial, sans-serif">
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you didn’t request this, ignore this email.</p>
      </div>
    `;

    /* -------- EMAIL SEND -------- */
    if (process.env.NODE_ENV === 'development') {
      // DEV → Nodemailer
      await mailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });

      console.log(`📧 [DEV] Email OTP for ${email}: ${otp}`);
    } else {
      // PROD → Resend
      await resend.emails.send({
        from: 'Logix <no-reply@logixjunction.com>',
        to: email,
        subject,
        html,
      });
    }
    /* ---------------------------- */

    return res.json({ success: true, message: 'OTP sent' });

  } catch (error) {
    console.error('sendEmailOtp error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const verifyEmailOtp = async (req, res) => {
    const { email, otp } = req.body;

    const storedOtp = await redisClient.get(`otp:${email}`);

    if (!storedOtp || storedOtp !== otp) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await redisClient.del(`otp:${email}`);

    const tempToken = jwt.sign(
        { email, type: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    res.json({
        success: true,
        tempToken,
    });
};

// simple email validation
const isValidEmail = (email) => typeof email === 'string' && /\S+@\S+\.\S+/.test(email);

const createFtlShipment = async (req, res, next) => {
    try {

        // req.body may be undefined for multipart/form-data without parsing middleware
        const data = req.body || {};
        if (req.verifiedEmail !== data.email) {
            return res.status(401).json({
                success: false,
                message: 'Email mismatch with verified email',
            });
        }


        /* ---------------- NORMALIZE FIELDS ---------------- */
        // support both 'contactNumber' and legacy 'phone' field from frontend
        const rawNumber = data.contactNumber || data.phone || '';
        const contactNumberDigits = String(rawNumber).replace(/\D/g, ''); // strip non-digits

        // Log a masked summary for debugging (avoid logging full PII)
        const last4 = contactNumberDigits ? contactNumberDigits.slice(-4) : 'N/A';
        console.log(`[createFtlShipment] received phone digits=${contactNumberDigits.length} last4=${last4}`);

        // prefer backend expected names but accept common frontend fields
        const pickupAddressLine = (data.pickupAddressLine || data.pickupAddressLine1 || data.pickupAddress || '').trim() || null;
        const pickupCity = data.pickupCity || data.pickupCity || null;
        const pickupState = data.pickupState || data.pickupState || null;
        const pickupPincode = data.pickupPincode || data.pickupPincode || data.pickupPincode || data.pickupPincode || data.pickupPincode || null;

        const deliveryAddressLine = (data.deliveryAddressLine || data.deliveryAddressLine1 || data.dropAddressLine1 || '').trim() || null;
        const deliveryCity = data.deliveryCity || data.dropCity || null;
        const deliveryState = data.deliveryState || data.dropState || null;
        const deliveryPincode = data.deliveryPincode || data.dropPincode || null;

        const expectedPickupDate = data.expectedPickupDate || data.expectedPickup || null;
        const expectedDeliveryDate = data.expectedDeliveryDate || data.expectedDelivery || null;

        const materialType = data.materialType || null;
        const customMaterialType = data.customMaterialType || null;

        const weightKg = data.weightKg ? Number(data.weightKg) : (data.weight ? Number(data.weight) : null);
        const length = data.length ? Number(data.length) : null;
        const width = data.width ? Number(data.width) : null;
        const height = data.height ? Number(data.height) : null;
        const dimensionUnit = data.dimensionUnit || data.unit || null;

        const transportMode = data.transportMode || null;
        const bodyType = data.bodyType || null;
        const truckSize = data.truckSize || null;
        const coolingType = data.coolingType || null;

        const manpower = data.manpower || 'no';
        const noOfLabours = data.noOfLabours ? Number(data.noOfLabours) : (manpower === 'yes' ? null : 0);

        // ---------------- BASIC VALIDATIONS ---------------- */
        if (!isValidEmail(data.email)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing email' });
        }
        if (!contactNumberDigits || contactNumberDigits.length !== 10) {
            // return helpful message with digit count to aid debugging
            return res.status(400).json({ success: false, message: `Invalid or missing phone number (expected 10 digits, got ${contactNumberDigits.length})` });
        }

        // normalized contact number to store/use
        const contactNumber = contactNumberDigits;

        /* ---------------- CONDITIONAL VALIDATIONS ---------------- */

        // Check for required normalized fields
        const missing = [];
        if (!pickupAddressLine) missing.push('pickupAddressLine');
        if (!deliveryAddressLine) missing.push('deliveryAddressLine');
        if (!deliveryState) missing.push('deliveryState');
        if (!deliveryPincode) missing.push('deliveryPincode');
        if (weightKg === null || Number.isNaN(weightKg)) missing.push('weightKg');

        if (missing.length > 0) {
            return res.status(400).json({ success: false, message: 'Missing required fields', missing });
        }

        // materialType = other → customMaterialType required
        if (materialType === 'other' && !customMaterialType) {
            return res.status(400).json({
                success: false,
                message: 'Custom material type is required when material type is other',
            });
        }

        // bodyType = closed → coolingType required
        if (bodyType === 'closed' && !coolingType) {
            return res.status(400).json({
                success: false,
                message: 'Cooling type is required for closed body vehicle',
            });
        }

        // transportMode = road → truckSize required
        if (transportMode === 'road' && !truckSize) {
            return res.status(400).json({
                success: false,
                message: 'Truck size is required for road transport',
            });
        }

        // truckSize = small_vehicle → smallVehicleType required
        if (truckSize === 'small_vehicle' && !data.smallVehicleType) {
            return res.status(400).json({
                success: false,
                message: 'Small vehicle type is required',
            });
        }

        // manpower = yes → noOfLabours required
        if (manpower === 'yes' && (!noOfLabours || noOfLabours <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Number of labours is required when manpower is yes',
            });
        }

        /* ---------------- FIND OR CREATE CLIENT ---------------- */

        let client = await Client.findOne({ where: { email: data.email } });

        if (!client) {
            client = await Client.create({
                name: data.contactName || null,
                email: data.email,
                phoneNumber: contactNumber,
            });
        }

        /* ---------------- CREATE FTL SHIPMENT ---------------- */

        const shipment = await Ftl.create({
            clientId: client.id,

            pickupAddressLine: pickupAddressLine,
            pickupCity: pickupCity,
            pickupState: pickupState,
            pickupPincode: pickupPincode,

            deliveryAddressLine: deliveryAddressLine,
            deliveryCity: deliveryCity,
            deliveryState: deliveryState,
            deliveryPincode: deliveryPincode,

            expectedPickupDate: expectedPickupDate,
            expectedDeliveryDate: expectedDeliveryDate,

            materialType: materialType,
            customMaterialType: customMaterialType,

            weightKg: weightKg,
            length: length,
            width: width,
            height: height,
            volumetricWeightKg: data.volumetricWeightKg || null,
            dimensionUnit: dimensionUnit,

            transportMode: transportMode,
            shipmentType: 'ftl',
            bodyType: bodyType,
            truckSize: truckSize,
            coolingType: coolingType,
            smallVehicleType: data.smallVehicleType || null,

            manpower: manpower,
            noOfLabours: noOfLabours,

            materialValue: data.materialValue ? Number(data.materialValue) : null,
            additionalNotes: data.additionalNotes || null,
        });

        return res.status(201).json({
            success: true,
            message: 'FTL shipment created successfully',
            shipmentId: shipment.id,
            clientId: client.id,
        });

    } catch (error) {
        next(error); // global error handler
    }
};
// --------------------added whole by amit

module.exports = {
    sendEmailOtp,
    verifyEmailOtp,
    createFtlShipment
}