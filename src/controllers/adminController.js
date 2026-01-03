const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const JWT_SECRET = process.env.JWT_SECRET;

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }



        const admin = await Admin.findOne({ where: { email } });


        if (!admin) {
         
            return res.status(401).json({ message: 'Invalid credentials'});
        }

        const isValid = await admin.comparePassword(password);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            token,
            message: "Login Succesfully "
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
};
