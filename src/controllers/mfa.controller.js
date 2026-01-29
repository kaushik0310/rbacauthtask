const otp = require("../utils/otp");
const db = require("../config/db");
const responseHandler = require("../utils/customResponse");

/** Step 1: Generate secret and return otpauth URL. Do NOT set mfa_enabled yet. */
exports.enableMFA = async (req, res) => {
  try {
    const secret = otp.generateSecret();
    await db.execute(
      "UPDATE users SET mfa_secret = ? WHERE id = ?",
      [secret.base32, req.user.id]
    );
    return responseHandler.success(res, {
      success: true,
      data: { otpAuthUrl: secret.otpauth_url },
    });
  } catch (error) {
    console.log("error", error);
    return responseHandler.error(
      res,
      { success: false, message: "Internal Server Error" },
      500
    );
  }
};

/** Step 2: User sends OTP from app. Verify; only then set mfa_enabled = 1. */
exports.verifyMFA = async (req, res) => {
  try {
    const { otp: otpCode } = req.body;
    if (!otpCode) {
      return responseHandler.error(
        res,
        { success: false, message: "OTP required" },
        400
      );
    }

    const [[user]] = await db.execute(
      "SELECT mfa_secret FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user || !user.mfa_secret) {
      return responseHandler.error(
        res,
        { success: false, message: "MFA setup not started. Call /auth/mfa/setup first." },
        400
      );
    }

    const valid = otp.verifyOTP(user.mfa_secret, otpCode);
    if (!valid) {
      return responseHandler.error(
        res,
        { success: false, message: "Invalid OTP" },
        401
      );
    }

    await db.execute("UPDATE users SET mfa_enabled = 1 WHERE id = ?", [
      req.user.id,
    ]);
    return responseHandler.success(res, {
      success: true,
      message: "MFA enabled successfully",
    });
  } catch (error) {
    console.log("error", error);
    return responseHandler.error(
      res,
      { success: false, message: "Internal Server Error" },
      500
    );
  }
};
