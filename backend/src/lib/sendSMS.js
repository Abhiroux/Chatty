import twilio from "twilio";

let client = null;

function getClient() {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }
  return client;
}

export const sendOTPSMS = async (phone, otp) => {
  await getClient().messages.create({
    body: `Your Chat App OTP is ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone.startsWith("+") ? phone : `+91${phone}`,
  });
};
