const authService = require("../services/auth.service");
const responseHandler = require("../utils/customResponse");

exports.register = async (req, res) => {
  try {
    const { email, password: pwd } = req.body;
    const result = await authService.register(email, pwd);

    if (!result.success) {
      return responseHandler.error(
        res,
        { success: false, message: result.message },
        result.statusCode
      );
    }
    return responseHandler.success(
      res,
      { success: true, message: "Registered successfully" },
      result.statusCode || 201
    );
  } catch (error) {
    console.log("error", error);
    return responseHandler.error(
      res,
      { success: false, message: "Internal Server Error" },
      500
    );
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password: pwd, otp: otpCode } = req.body;
    const result = await authService.login(email, pwd, otpCode);

    if (!result.success) {
      return responseHandler.error(
        res,
        { success: false, message: result.message },
        result.statusCode
      );
    }
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

exports.refresh = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.refresh(token);

    if (!result.success) {
      return responseHandler.error(
        res,
        { success: false, message: result.message },
        result.statusCode
      );
    }
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
