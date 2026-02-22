import crypto from "crypto";
import otpGenerator from "otp-generator";

export function generateOTP() {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
}

export function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
