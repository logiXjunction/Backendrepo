const { redisClient } = require('../config/redis');

const OTP_TTL = 300; // 5 minutes

const storeOtp = async (email, otp) => {
  if (!redisClient.isOpen) return;
  await redisClient.set(`otp:${email}`, otp, { EX: OTP_TTL });
};

const verifyOtp = async (email, otp) => {
  if (!redisClient.isOpen) return false;
  const savedOtp = await redisClient.get(`otp:${email}`);
  return savedOtp === otp;
};

module.exports = { storeOtp, verifyOtp };
