const jwt = require('jsonwebtoken');
const Transporter = require('../models/transporter');

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



const authenticateAdmin = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            }); 
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }
        
        // Attach admin info to request object
        req.admin = {
            id: decoded.id,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired.' 
            });
        }
        
        return res.status(500).json({ 
            message: 'Internal server error.',
            error: error.message 
        });
    }
};

module.exports = {
  verifyJWT,
  requireTransporter,
  attachTransporter,
  authenticateAdmin
};
