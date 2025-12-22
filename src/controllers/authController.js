// const Transporter = require("../models/transporter");
// const { redisClient } = require("../config/redis");
// const { nodemailerTransporter } = require("../config/nodemailer");

// // -------------------- HELPERS --------------------
// const generateOtp = () =>
//     Math.floor(100000 + Math.random() * 900000).toString();

// // -------------------- SEND OTP --------------------
// exports.sendOtp = async (req, res) => {
//     try {
//         const { email } = req.body;

//         if (!email || !/\S+@\S+\.\S+/.test(email)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid email",
//             });
//         }

//         const existingUser = await Transporter.findOne({ where: { email } });
//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Transporter already exists",
//             });
//         }

//         const otp = generateOtp();

//         // prevent spamming
//         const existingOtp = await redisClient.get(`otp:${email}`);
//         if (existingOtp) {
//             return res.status(400).json({
//                 success: false,
//                 message: "OTP already sent. Please wait.",
//             });
//         }

//         await redisClient.setEx(`otp:${email}`, 300, otp);

//         await nodemailerTransporter.sendMail({
//             from: process.env.SMTP_FROM,
//             to: email,
//             subject: "Your OTP - LogixJunction",
//             text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
//         });

//         return res.json({
//             success: true,
//             message: "OTP sent successfully",
//         });
//     } catch (err) {
//         console.error("Send OTP error:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// };

// // -------------------- VERIFY OTP --------------------
// exports.verifyOtp = async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         if (!email || !otp) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Email and OTP required",
//             });
//         }

//         const savedOtp = await redisClient.get(`otp:${email}`);

//         if (!savedOtp || savedOtp !== otp) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid or expired OTP",
//             });
//         }

//         await redisClient.del(`otp:${email}`);
//         await redisClient.setEx(`verified:${email}`, 600, "true");

//         return res.json({
//             success: true,
//             message: "OTP verified successfully",
//         });
//     } catch (err) {
//         console.error("Verify OTP error:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// };

// // -------------------- REGISTER TRANSPORTER --------------------
// exports.registerTransporter = async (req, res) => {
//     try {
//         const {
//             email,
//             ownerName,
//             phone,
//             companyName,
//         } = req.body;

//         // ✅ REQUIRED FIELD CHECK (prevents 500)
//         if (!email || !ownerName || !phone || !companyName) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required",
//             });
//         }

//         // ✅ OTP VERIFIED CHECK
//         const isVerified = await redisClient.get(`verified:${email}`);
//         if (!isVerified) {
//             return res.status(401).json({
//                 success: false,
//                 message: "OTP not verified",
//             });
//         }

//         const transporter = await Transporter.create({
//             email,
//             ownerName,
//             phone,
//             companyName,
//         });

//         // cleanup
//         await redisClient.del(`verified:${email}`);

//         return res.status(201).json({
//             success: true,
//             message: "Transporter registered successfully",
//             data: transporter,
//         });
//     } catch (err) {
//         console.error("Register error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error",
//         });
//     }
// };

