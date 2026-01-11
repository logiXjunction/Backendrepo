const jwt = require('jsonwebtoken');
const Transporter = require('../models/transporter');
const Client = require('../models/client')
/**
 * 1 Verify JWT token
 */

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Unauthorized access. Token missing.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized access. Invalid or expired token.'
    });
  }
};

/**
 * 2️ Ensure role is transporter
 */
const requireTransporter = (req, res, next) => {
  if (!req.user || req.user.role !== 'transporter') {
    return res.status(403).json({
      message: 'Access denied. Transporter only.'
    });
  }
  next();
};

/**
 * 3️ Attach transporter from DB
 */
const attachTransporter = async (req, res, next) => {
  try {
    const transporter = await Transporter.findByPk(req.user.id);

    if (!transporter) {
      return res.status(401).json({
        message: 'Transporter not found.'
      });
    }

    req.transporter = transporter; 
    next();
  } catch (error) {
    console.error('Transporter middleware error:', error);
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};


const clientMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const client = await Client.findByPk(decoded.id);
    if (!client)
      return res.status(401).json({ message: 'User not found' });

    req.user = client;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


const tempFtlTokenCheck = (req, res, next) => {
  const token = req.headers['x-email-token'];

  if (!token) {
    return res.status(401).json({ message: 'Email verification required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'email_verification') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    req.verifiedEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  verifyJWT,
  requireTransporter,
  attachTransporter,
  tempFtlTokenCheck,
  clientMiddleware
};
