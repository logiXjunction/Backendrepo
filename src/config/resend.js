let resend = null;

if (process.env.NODE_ENV === "production") {
  const { Resend } = require("resend");

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing in production");
  }

  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.log("Email service disabled (development mode)");
}

module.exports = resend;
