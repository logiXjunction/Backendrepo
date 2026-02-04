const resend = require('../config/resend');

const sendOtpEmail = async ({ to, otp }) => {
  return resend.emails.send({
    from: 'Logix <no-reply@logixjunction.com>',
    to,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif">
        <h2>Verification Code</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
