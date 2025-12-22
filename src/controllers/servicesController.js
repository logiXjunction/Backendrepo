const { Client, PackersRequest, PtlRequest } = require('../models');
const { redisClient } = require('../config/redis');
const { uploadToS3, getSignedUrlFromS3 } = require('../utils/s3');
const { nodemailerTransporter } = require('../config/nodemailer');

const isValidEmail = (email) => typeof email === 'string' && /\S+@\S+\.\S+/.test(email);

exports.createPackersRequest = async (req, res, next) => {
    try {
        // multer will populate req.body (fields) and req.files (images)
        const data = req.body || {};

        const name = (data.name || '').trim();
        const email = (data.email || '').trim() || null;
        const phoneRaw = (data.phone || '').replace(/\D/g, '');

        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
        if (!phoneRaw || phoneRaw.length < 10 || phoneRaw.length > 15) {
            return res.status(400).json({ success: false, message: 'Invalid or missing phone number' });
        }

        if (!data.pickupAddress || !data.dropoffAddress) {
            return res.status(400).json({ success: false, message: 'Pickup and dropoff addresses are required' });
        }

        if (!data.pickupDate) return res.status(400).json({ success: false, message: 'Pickup date is required' });

        // items sent as JSON string from frontend
        let items = [];
        try {
            items = data.items ? JSON.parse(data.items) : [];
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid items format' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        // Optional: verify email OTP if email provided and you want strict check
        if (email && !isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email' });
        }

        // Find or create client if email provided
        let client = null;
        if (email) {
            client = await Client.findOne({ where: { email } });
            if (!client) {
                client = await Client.create({ name, email, phoneNumber: phoneRaw });
            }
        } else {
            // If no email, look up via phone
            client = await Client.findOne({ where: { phoneNumber: phoneRaw } });
            if (!client) {
                client = await Client.create({ name, phoneNumber: phoneRaw });
            }
        }

        // Upload images to S3 (if any)
        const files = req.files || [];
        const uploadedKeys = [];

        for (const f of files) {
            try {
                const key = await uploadToS3(f);
                if (key) uploadedKeys.push(key);
            } catch (err) {
                console.error('S3 upload error for file', f.originalname, err);
            }
        }

        // Create record
        const record = await PackersRequest.create({
            clientId: client ? client.id : null,
            name,
            email,
            phone: phoneRaw,
            pickupAddress: data.pickupAddress,
            dropoffAddress: data.dropoffAddress,
            pickupDate: data.pickupDate,
            pickupTime: data.pickupTime || null,
            vehicleType: data.vehicleType || null,
            estimatedWeight: data.estimatedWeight ? Number(data.estimatedWeight) : null,
            insurance: data.insurance === 'true' || data.insurance === true,
            items,
            images: uploadedKeys,
            additionalNotes: data.notes || null,
        });

        // Send notification email to admin (if configured)
        try {
            const adminTo = process.env.NOTIFY_TO || process.env.SMTP_FROM || process.env.SMTP_USER;
            const imgLinks = await Promise.all(uploadedKeys.map(k => getSignedUrlFromS3(k, 3600).catch(() => null)));

            await nodemailerTransporter.sendMail({
                from: process.env.SMTP_FROM,
                to: adminTo,
                subject: 'New Packers & Movers request',
                text: `A new packers & movers request was created.\n\nRequester: ${name} (${phoneRaw})\nEmail: ${email || 'N/A'}\nPickup: ${data.pickupAddress}\nDropoff: ${data.dropoffAddress}\nPickup date: ${data.pickupDate}\nItems: ${JSON.stringify(items)}\nImages: ${imgLinks.join('\n')}`,
            });
        } catch (mailErr) {
            console.warn('Failed to send notification email:', mailErr && mailErr.message ? mailErr.message : mailErr);
        }

        return res.status(201).json({ success: true, message: 'Packers request created', id: record.id });
    } catch (err) {
        next(err);
    }
};

// Create a simple PTL lead when PTL is selected from frontend (name + phone required)
exports.createPtlRequest = async (req, res, next) => {
    try {
        const data = req.body || {};
        const name = (data.name || '').trim();
        const phoneRaw = (data.phone || '').replace(/\D/g, '');
        const message = data.message ? String(data.message).trim() : null;

        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
        if (!phoneRaw || phoneRaw.length < 10 || phoneRaw.length > 15) {
            return res.status(400).json({ success: false, message: 'Invalid or missing phone number' });
        }

        // Find or create client by phone
        let client = await Client.findOne({ where: { phoneNumber: phoneRaw } });
        if (!client) {
            client = await Client.create({ name, phoneNumber: phoneRaw });
        }

        const record = await PtlRequest.create({
            clientId: client ? client.id : null,
            name,
            phone: phoneRaw,
            message,
        });

        // Notify admin via email (best-effort)
        try {
            const adminTo = process.env.NOTIFY_TO || process.env.SMTP_FROM || process.env.SMTP_USER;
            await nodemailerTransporter.sendMail({
                from: process.env.SMTP_FROM,
                to: adminTo,
                subject: 'New PTL lead',
                text: `New PTL lead: ${name} (${phoneRaw})\nMessage: ${message || 'N/A'}`,
            });
        } catch (mailErr) {
            console.warn('Failed to send PTL notification email:', mailErr && mailErr.message ? mailErr.message : mailErr);
        }

        return res.status(201).json({ success: true, message: 'PTL lead created', id: record.id });
    } catch (err) {
        next(err);
    }
};
