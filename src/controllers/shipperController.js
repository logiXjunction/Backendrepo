const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');
const { Client } = require('../models');

exports.registerShipper = async (req, res) => {
    try {
        const token = req.headers['emailverificationtoken'];
        const {
            ownerName,
            ownerContactNumber,
            email,
            phoneNumber,
            password,
            companyName,
            companyAddress,
            gstNumber,
        } = req.body;

        // Basic validations
        if (!email || !ownerName || !ownerContactNumber || !phoneNumber || !password || !companyName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Email verification token missing' });
        }

        const savedEmail = await redisClient.get(`emailVerificationToken:${token}`);
        if (!savedEmail || savedEmail !== email) {
            return res.status(401).json({ success: false, message: 'Invalid or expired email verification token' });
        }

        // check if client already exists
        const existing = await Client.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const client = await Client.create({
            name: ownerName,
            phoneNumber: phoneNumber,
            email,
            password,
            companyName,
            companyAddress,
            gstNumber,
        });

        // cleanup verification token
        await redisClient.del(`emailVerificationToken:${token}`);

        // generate short-lived onboarding token for profile completion
        const onboardingToken = jwt.sign({ id: client.id, email: client.email, userType: 'shipper', onboarding: true }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({ success: true, message: 'Shipper registered successfully', data: { id: client.id, email: client.email, onboardingToken } });
    } catch (err) {
        console.error('registerShipper error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.loginShipper = async (req, res) => {
    try {
        const { email, mobileNumber, password } = req.body;
        if (!password || (!email && !mobileNumber)) {
            return res.status(400).json({ success: false, message: 'Email or mobileNumber and password are required' });
        }

        const where = email ? { email } : { phoneNumber: mobileNumber };
        const user = await Client.findOne({ where });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, userType: 'shipper' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({ success: true, message: 'Login successful', token, profile: { id: user.id, name: user.name, email: user.email, companyName: user.companyName } });
    } catch (err) {
        console.error('loginShipper error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.verify = async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userType !== 'shipper') {
            return res.status(403).json({ success: false, message: 'Invalid user type' });
        }
        const user = await Client.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, shipperProfile: user });
    } catch (err) {
        console.error('verify error:', err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Update shipper profile (requires onboarding token or normal JWT)
exports.updateProfile = async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userType !== 'shipper') {
            return res.status(403).json({ success: false, message: 'Invalid user type' });
        }

        const user = await Client.findByPk(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const {
            ownerName,
            ownerContactNumber,
            companyName,
            companyAddress,
            gstNumber,
            password,
            phoneNumber,
        } = req.body;

        await user.update({
            name: ownerName || user.name,
            phoneNumber: phoneNumber || user.phoneNumber,
            companyName: companyName || user.companyName,
            companyAddress: companyAddress || user.companyAddress,
            gstNumber: gstNumber || user.gstNumber,
            password: password || user.password,
        });

        return res.json({ success: true, message: 'Profile updated', profile: { id: user.id, name: user.name, email: user.email, companyName: user.companyName } });
    } catch (err) {
        console.error('updateProfile error:', err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};