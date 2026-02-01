const otp = require("../utils/otp");

const getPool = () => {
  const pool = global.pool;
  if (!pool) throw new Error("Database pool not initialized");
  return pool;
};

/**
 * Step 1: Generate MFA secret and store it. Return otpauth URL (do NOT set mfa_enabled yet).
 * @param {number} userId
 * @returns {{ success: true, data: { otpAuthUrl: string } }} | {{ success: false, message: string, statusCode: number }}
 */
exports.enableMFA = async (userId) => {
  const pool = getPool();
  const secret = otp.generateSecret();
  await pool.execute(
    "UPDATE users SET mfa_secret = ? WHERE id = ?",
    [secret.base32, userId]
  );
  return {
    success: true,
    data: { otpAuthUrl: secret.otpauth_url },
  };
};

/**
 * Step 2: Verify OTP from app; only then set mfa_enabled = 1.
 * @param {number} userId
 * @param {string} otpCode
 * @returns {{ success: true }} | {{ success: false, message: string, statusCode: number }}
 */
exports.verifyMFA = async (userId, otpCode) => {
  const pool = getPool();

  if (!otpCode) {
    return { success: false, message: "OTP required", statusCode: 400 };
  }

  const [[user]] = await pool.execute(
    "SELECT mfa_secret FROM users WHERE id = ?",
    [userId]
  );
  if (!user || !user.mfa_secret) {
    return {
      success: false,
      message: "MFA setup not started. Call /auth/mfa/setup first.",
      statusCode: 400,
    };
  }

  const valid = otp.verifyOTP(user.mfa_secret, otpCode);
  if (!valid) {
    return { success: false, message: "Invalid OTP", statusCode: 401 };
  }

  await pool.execute("UPDATE users SET mfa_enabled = 1 WHERE id = ?", [userId]);
  return { success: true };
};
