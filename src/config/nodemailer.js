const nodemailer = require("nodemailer");

const nodemailerTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true only for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
nodemailerTransporter.verify((err, success) => {
    if (err) {
        console.error("SMTP VERIFY FAILED ❌", err);
    } else {
        console.log("SMTP VERIFY SUCCESS ✅");
    }
});

module.exports = { nodemailerTransporter };



