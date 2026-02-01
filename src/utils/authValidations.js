const { body, validationResult } = require("express-validator");
const responseHandler = require("./customResponse");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return responseHandler.error(
      res,
      {
        success: false,
        message: "Validation failed",
        data: errors.array(),
      },
      400
    );
  }
  next();
};

const registerRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

const refreshRules = [body("refreshToken").notEmpty().withMessage("Refresh token required")];

const mfaVerifyRules = [body("otp").notEmpty().withMessage("OTP required")];

module.exports = {
  validate,
  registerRules,
  loginRules,
  refreshRules,
  mfaVerifyRules,
};
