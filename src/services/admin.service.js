const password = require("../utils/password");

const getPool = () => {
  const pool = global.pool;
  if (!pool) throw new Error("Database pool not initialized");
  return pool;
};

const ROLE_IDS = { ADMIN: 1, USER: 2 };

/**
 * List all users (id, email, role_id, mfa_enabled).
 * @returns {{ success: true, users: Array }}
 */
exports.listUsers = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    "SELECT u.id, u.email, u.role_id, u.mfa_enabled FROM users u"
  );
  return { success: true, users: rows };
};

/**
 * Delete a user by id. Cannot delete yourself.
 * @param {string|number} userId - User id to delete
 * @param {number} currentUserId - Logged-in user id (cannot delete self)
 * @returns {{ success: true, message: string }} | {{ success: false, message: string, statusCode: number }}
 */
exports.deleteUser = async (userId, currentUserId) => {
  const pool = getPool();

  if (String(userId) === String(currentUserId)) {
    return { success: false, message: "Cannot delete yourself", statusCode: 400 };
  }

  const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [
    userId,
  ]);

  if (result.affectedRows === 0) {
    return { success: false, message: "User not found", statusCode: 404 };
  }

  return { success: true, message: "User deleted" };
};

/**
 * Create a user (admin or regular). Only admins with CHANGE_ROLE can call this.
 * @param {string} email
 * @param {string} pwd - Plain password (will be hashed)
 * @param {string} role - "ADMIN" or "USER"
 * @returns {{ success: true, message: string, statusCode: number }} | {{ success: false, message: string, statusCode: number }}
 */
exports.createUser = async (email, pwd, role) => {
  const pool = getPool();

  const roleId = ROLE_IDS[role];
  if (!roleId) {
    return { success: false, message: "Role must be ADMIN or USER", statusCode: 400 };
  }

  const [[existing]] = await pool.execute("SELECT id FROM users WHERE email = ?", [
    email,
  ]);
  if (existing) {
    return { success: false, message: "Email already registered", statusCode: 400 };
  }

  const hash = await password.hash(pwd);
  await pool.execute(
    "INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)",
    [email, hash, roleId]
  );
  return { success: true, message: "User created", statusCode: 201 };
};
