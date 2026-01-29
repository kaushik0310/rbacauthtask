const db = require("../config/db");
const otp = require("../utils/otp");
const { sendError } = require("../utils/errors");
const rbac = require("./rbac.middleware");

/**
 * Requires both the given permission AND a valid OTP in body.otp or header x-otp.
 */
module.exports = (permission) => {
  const permissionCheck = rbac(permission);

  return (req, res, next) => {
    permissionCheck(req, res, async (err) => {
      if (err) return next(err);
      if (res.headersSent) return;

      const otpCode = req.body?.otp ?? req.headers["x-otp"];
      if (!otpCode) {
        return sendError(res, 400, "OTP required for this action", "OTP_REQUIRED");
      }

      try {
        const [[user]] = await db.execute(
          "SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?",
          [req.user.id]
        );
        if (!user || !user.mfa_enabled || !user.mfa_secret) {
          return sendError(res, 403, "MFA must be enabled for this action", "MFA_REQUIRED");
        }

        const valid = otp.verifyOTP(user.mfa_secret, otpCode);
        if (!valid) {
          return sendError(res, 401, "Invalid OTP", "INVALID_OTP");
        }
        next();
      } catch (e) {
        next(e);
      }
    });
  };
};
