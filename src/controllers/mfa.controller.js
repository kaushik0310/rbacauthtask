const mfaService = require("../services/mfa.service");
const responseHandler = require("../utils/customResponse");

/** Step 1: Generate secret and return otpauth URL. Do NOT set mfa_enabled yet. */
exports.enableMFA = async (req, res) => {
  try {
    const result = await mfaService.enableMFA(req.user.id);
    return responseHandler.success(res, {
      success: true,
      data: result.data,
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
    const result = await mfaService.verifyMFA(req.user.id, otpCode);

    if (!result.success) {
      return responseHandler.error(
        res,
        { success: false, message: result.message },
        result.statusCode
      );
    }
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
