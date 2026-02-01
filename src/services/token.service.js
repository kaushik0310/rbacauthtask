const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { accessSecret, refreshSecret } = require("../config/jwt");

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY_DAYS = 7;
const MFA_TOKEN_EXPIRY = "5m";

exports.generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    accessSecret,
    { expiresIn: ACCESS_EXPIRY }
  );

exports.generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id },
    refreshSecret,
    { expiresIn: `${REFRESH_EXPIRY_DAYS}d` }
  );

exports.hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

exports.getRefreshExpiresAt = () => {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_EXPIRY_DAYS);
  return d;
};

exports.verifyAccessToken = (token) =>
  jwt.verify(token, accessSecret);

exports.verifyRefreshToken = (token) =>
  jwt.verify(token, refreshSecret);

/** Short-lived token returned when login requires MFA; used to complete login with OTP. */
exports.generateMfaToken = (userId) =>
  jwt.sign(
    { id: userId, purpose: "mfa" },
    accessSecret,
    { expiresIn: MFA_TOKEN_EXPIRY }
  );

exports.verifyMfaToken = (token) => {
  const payload = jwt.verify(token, accessSecret);
  if (payload.purpose !== "mfa") throw new Error("Invalid MFA token");
  return payload;
};
