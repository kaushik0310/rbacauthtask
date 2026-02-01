const password = require("../utils/password");
const tokenService = require("../services/token.service");
const otp = require("../utils/otp");
const config = require("../config");

const getPool = () => {
  const pool = global.pool;
  if (!pool) throw new Error("Database pool not initialized");
  return pool;
};

/**
 * Register a new user.
 * @returns {{ success: true }} | {{ success: false, message: string, statusCode: number }}
 */
exports.register = async (email, pwd) => {
  const pool = getPool();
  const hash = await password.hash(pwd);
  const roleId = config.defaultRoleId;

  const [[existing]] = await pool.execute("SELECT id FROM users WHERE email = ?", [
    email,
  ]);
  if (existing) {
    return { success: false, message: "Email already registered", statusCode: 400 };
  }

  await pool.execute(
    "INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)",
    [email, hash, roleId]
  );
  return { success: true, statusCode: 201 };
};

/**
 * Login user. Returns tokens or MFA requirement (requiresMfa + mfaToken). MFA step is completed via loginWithMfa.
 * @returns {{ success: true, data: object }} | {{ success: false, message: string, statusCode: number }}
 */
exports.login = async (email, pwd) => {
  const pool = getPool();

  const [[user]] = await pool.execute(
    `SELECT u.id, u.email, u.password_hash, u.role_id, u.mfa_enabled, u.mfa_secret, r.name AS role
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );

  if (!user || !(await password.compare(pwd, user.password_hash))) {
    return { success: false, message: "Invalid credentials", statusCode: 401 };
  }

  if (user.mfa_enabled) {
    const mfaToken = tokenService.generateMfaToken(user.id);
    return { success: true, data: { requiresMfa: true, mfaToken } };
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

  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [user.id, tokenHash, expiresAt]
  );

  return {
    success: true,
    data: {
      accessToken,
      refreshToken,
      expiresIn: "15m",
    },
  };
};

/**
 * Refresh access token using a valid refresh token.
 * @returns {{ success: true, data: object }} | {{ success: false, message: string, statusCode: number }}
 */
exports.refresh = async (token) => {
  const pool = getPool();

  if (!token) {
    return { success: false, message: "Refresh token required", statusCode: 400 };
  }

  let payload;
  try {
    payload = tokenService.verifyRefreshToken(token);
  } catch {
    return { success: false, message: "Invalid or expired refresh token", statusCode: 401 };
  }

  const tokenHash = tokenService.hashRefreshToken(token);
  const [[row]] = await pool.execute(
    `SELECT id, user_id FROM refresh_tokens
     WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()`,
    [payload.id, tokenHash]
  );

  if (!row) {
    return { success: false, message: "Invalid or expired refresh token", statusCode: 401 };
  }

  const [[user]] = await pool.execute(
    `SELECT u.id, r.name AS role FROM users u
     LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [payload.id]
  );
  if (!user) {
    return { success: false, message: "User not found", statusCode: 401 };
  }

  const userPayload = { id: user.id, role: user.role || "USER" };
  const accessToken = tokenService.generateAccessToken(userPayload);

  await pool.execute("DELETE FROM refresh_tokens WHERE id = ?", [row.id]);

  const newRefreshToken = tokenService.generateRefreshToken(userPayload);
  const newHash = tokenService.hashRefreshToken(newRefreshToken);
  const expiresAt = tokenService.getRefreshExpiresAt();
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [payload.id, newHash, expiresAt]
  );

  await pool.execute("DELETE FROM refresh_tokens WHERE expires_at < NOW()");

  return {
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: "15m",
    },
  };
};

/**
 * Complete login with MFA: verify short-lived mfaToken and OTP, then issue tokens.
 * Call this when first login returned requiresMfa: true and mfaToken.
 * @returns {{ success: true, data: object }} | {{ success: false, message: string, statusCode: number }}
 */
exports.loginWithMfa = async (mfaToken, otpCode) => {
  const pool = getPool();

  if (!mfaToken || !otpCode) {
    return { success: false, message: "mfaToken and otp required", statusCode: 400 };
  }

  let payload;
  try {
    payload = tokenService.verifyMfaToken(mfaToken);
  } catch {
    return { success: false, message: "Invalid or expired MFA token. Login again.", statusCode: 401 };
  }

  const [[user]] = await pool.execute(
    `SELECT u.id, u.email, u.mfa_secret, u.role_id, r.name AS role
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [payload.id]
  );

  if (!user || !user.mfa_secret) {
    return { success: false, message: "User not found or MFA not enabled", statusCode: 401 };
  }

  const valid = otp.verifyOTP(user.mfa_secret, otpCode);
  if (!valid) {
    return { success: false, message: "Invalid OTP", statusCode: 401 };
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

  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [user.id, tokenHash, expiresAt]
  );

  return {
    success: true,
    data: {
      accessToken,
      refreshToken,
      expiresIn: "15m",
    },
  };
};
