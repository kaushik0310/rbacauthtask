const speakeasy = require("speakeasy");

exports.generateSecret = () =>
  speakeasy.generateSecret({ length: 20 });

exports.verifyOTP = (secret, token) =>
  speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1
  });
