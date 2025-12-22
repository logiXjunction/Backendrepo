// const crypto = require('crypto');
// const { redisClient } = require('../config/redis');
// const { nodemailerTransporter } = require('../config/nodemailer');

// const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// exports.sendEmailOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email || !/\S+@\S+\.\S+/.test(email)) {
//       return res.status(400).json({ success: false, message: 'Invalid email' });
//     }

//     const existingOtp = await redisClient.get(`emailOtp:${email}`);
//     if (existingOtp) {
//       return res.status(400).json({ success: false, message: 'OTP already sent. Please wait.' });
//     }

//     const otp = generateOtp();
//     await redisClient.setEx(`emailOtp:${email}`, 300, otp);

//     // send email (best effort)
//     try {
//       await nodemailerTransporter.sendMail({
//         from: process.env.SMTP_FROM,
//         to: email,
//         subject: 'Your verification OTP - LogixJunction',
//         text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
//       });
//     } catch (mailErr) {
//       console.error('Failed to send OTP email:', mailErr);
//       // Do not fail the whole request — OTP is stored and can be retrieved for testing/dev
//     }

//     return res.json({ success: true, message: 'OTP sent successfully' });
//   } catch (err) {
//     console.error('sendEmailOtp error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// exports.verifyEmailOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     if (!email || !otp) {
//       return res.status(400).json({ success: false, message: 'Email and OTP required' });
//     }

//     const savedOtp = await redisClient.get(`emailOtp:${email}`);

//     if (!savedOtp || savedOtp !== otp) {
//       return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
//     }

//     // cleanup
//     await redisClient.del(`emailOtp:${email}`);

//     // generate a short lived verification token and store mapping token->email
//     const token = crypto.randomUUID();
//     await redisClient.setEx(`emailVerificationToken:${token}`, 600, email); // 10 minutes

//     return res.json({ success: true, message: 'OTP verified', token });
//   } catch (err) {
//     console.error('verifyEmailOtp error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };