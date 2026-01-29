const db = require("../config/db");
const password = require("../utils/password");
const tokenService = require("../services/token.service");
const otp = require("../utils/otp");
const config = require("../config");
const responseHandler = require("../utils/customResponse");

exports.register = async (req, res) => {
  try {
    const { email, password: pwd } = req.body;
    const hash = await password.hash(pwd);
    const roleId = config.defaultRoleId;

    const [[existing]] = await db.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing) {
      return responseHandler.error(
        res,
        { success: false, message: "Email already registered" },
        400
      );
    }

    await db.execute(
      "INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)",
      [email, hash, roleId]
    );
    return responseHandler.success(
      res,
      { success: true, message: "Registered successfully" },
      201
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

    const [[user]] = await db.execute(
      `SELECT u.id, u.email, u.password_hash, u.role_id, u.mfa_enabled, u.mfa_secret, r.name AS role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.email = ?`,
      [email]
    );

    if (!user || !(await password.compare(pwd, user.password_hash))) {
      return responseHandler.error(
        res,
        { success: false, message: "Invalid credentials" },
        401
      );
    }

    if (user.mfa_enabled) {
      if (!otpCode) {
        return responseHandler.success(res, {
          success: true,
          data: { requiresMfa: true },
        });
      }
      const valid = otp.verifyOTP(user.mfa_secret, otpCode);
      if (!valid) {
        return responseHandler.error(
          res,
          { success: false, message: "Invalid OTP" },
          401
        );
      }
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role || "USER",
      role_id: user.role_id,
    };

    const accessToken = tokenService.generateAccessToken(userPayload);
    const refreshToken = tokenService.generateRefreshToken(userPayload);
    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    const expiresAt = tokenService.getRefreshExpiresAt();

    await db.execute(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [user.id, tokenHash, expiresAt]
    );

    return responseHandler.success(res, {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: "15m",
      },
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
    if (!token) {
      return responseHandler.error(
        res,
        { success: false, message: "Refresh token required" },
        400
      );
    }

    let payload;
    try {
      payload = tokenService.verifyRefreshToken(token);
    } catch {
      return responseHandler.error(
        res,
        { success: false, message: "Invalid or expired refresh token" },
        401
      );
    }

    const tokenHash = tokenService.hashRefreshToken(token);
    const [[row]] = await db.execute(
      `SELECT id, user_id FROM refresh_tokens
       WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()`,
      [payload.id, tokenHash]
    );

    if (!row) {
      return responseHandler.error(
        res,
        { success: false, message: "Invalid or expired refresh token" },
        401
      );
    }

    const [[user]] = await db.execute(
      `SELECT u.id, r.name AS role FROM users u
       LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      [payload.id]
    );
    if (!user) {
      return responseHandler.error(
        res,
        { success: false, message: "User not found" },
        401
      );
    }

    const userPayload = { id: user.id, role: user.role || "USER" };
    const accessToken = tokenService.generateAccessToken(userPayload);

    await db.execute("DELETE FROM refresh_tokens WHERE id = ?", [row.id]);

    const newRefreshToken = tokenService.generateRefreshToken(userPayload);
    const newHash = tokenService.hashRefreshToken(newRefreshToken);
    const expiresAt = tokenService.getRefreshExpiresAt();
    await db.execute(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [payload.id, newHash, expiresAt]
    );

    await db.execute("DELETE FROM refresh_tokens WHERE expires_at < NOW()");

    return responseHandler.success(res, {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: "15m",
      },
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
