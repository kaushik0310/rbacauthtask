"use strict";

/**
 * Generate a numeric OTP of given length (default 4).
 * @param {number} length - Length of OTP (default 4)
 * @returns {string} OTP string
 */
function generateOTP(length = 4) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

module.exports = generateOTP;
