import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      family: 4, // Force IPv4 (Render doesn't support IPv6)
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendOTPEmail(email, otp) {
  await getTransporter().sendMail({
    from: `"Chat App" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Your Chat App OTP",
    html: `<h2>OTP Verification</h2>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>`,
  });
}
