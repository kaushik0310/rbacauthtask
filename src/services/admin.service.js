const password = require("../utils/password");

const getPool = () => {
  const pool = global.pool;
  if (!pool) throw new Error("Database pool not initialized");
  return pool;
};

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
 * Role is resolved from the roles table by name (e.g. ADMIN, USER, MANAGER).
 * @param {string} email
 * @param {string} pwd - Plain password (will be hashed)
 * @param {string} role - Role name (must exist in roles table)
 * @returns {{ success: true, message: string, statusCode: number }} | {{ success: false, message: string, statusCode: number }}
 */
exports.createUser = async (email, pwd, role) => {
  const pool = getPool();
  const roleName = (role || "").trim();
  if (!roleName) {
    return { success: false, message: "Role name is required", statusCode: 400 };
  }

  const [[roleRow]] = await pool.execute(
    "SELECT id FROM roles WHERE name = ?",
    [roleName]
  );
  if (!roleRow) {
    return { success: false, message: "Role not found", statusCode: 400 };
  }
  const roleId = roleRow.id;

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

/**
 * Create a role. Requires CHANGE_ROLE.
 * @param {string} name - Role name (e.g. MANAGER)
 * @returns {{ success: true, data: { id, name }, statusCode: number }} | {{ success: false, message: string, statusCode: number }}
 */
exports.createRole = async (name) => {
  const pool = getPool();
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { success: false, message: "Role name is required", statusCode: 400 };
  }
  const [[existing]] = await pool.execute(
    "SELECT id FROM roles WHERE name = ?",
    [trimmed]
  );
  if (existing) {
    return { success: false, message: "Role name already exists", statusCode: 400 };
  }
  const [result] = await pool.execute("INSERT INTO roles (name) VALUES (?)", [
    trimmed,
  ]);
  return {
    success: true,
    data: { id: result.insertId, name: trimmed },
    statusCode: 201,
  };
};

/**
 * Create a permission. Requires CHANGE_ROLE.
 * @param {string} name - Permission name (e.g. EDIT_POSTS)
 * @returns {{ success: true, data: { id, name }, statusCode: number }} | {{ success: false, message: string, statusCode: number }}
 */
exports.createPermission = async (name) => {
  const pool = getPool();
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { success: false, message: "Permission name is required", statusCode: 400 };
  }
  const [[existing]] = await pool.execute(
    "SELECT id FROM permissions WHERE name = ?",
    [trimmed]
  );
  if (existing) {
    return { success: false, message: "Permission name already exists", statusCode: 400 };
  }
  const [result] = await pool.execute(
    "INSERT INTO permissions (name) VALUES (?)",
    [trimmed]
  );
  return {
    success: true,
    data: { id: result.insertId, name: trimmed },
    statusCode: 201,
  };
};

/**
 * Assign a permission to a role (role_permissions). Requires CHANGE_ROLE.
 * @param {number} roleId
 * @param {number} permissionId
 * @returns {{ success: true, message: string, statusCode: number }} | {{ success: false, message: string, statusCode: number }}
 */
exports.addRolePermission = async (roleId, permissionId) => {
  const pool = getPool();

  const [[role]] = await pool.execute("SELECT id FROM roles WHERE id = ?", [
    roleId,
  ]);
  if (!role) {
    return { success: false, message: "Role not found", statusCode: 404 };
  }
  const [[perm]] = await pool.execute(
    "SELECT id FROM permissions WHERE id = ?",
    [permissionId]
  );
  if (!perm) {
    return { success: false, message: "Permission not found", statusCode: 404 };
  }

  const [[existing]] = await pool.execute(
    "SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?",
    [roleId, permissionId]
  );
  if (existing) {
    return {
      success: false,
      message: "Permission already assigned to this role",
      statusCode: 400,
    };
  }

  await pool.execute(
    "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
    [roleId, permissionId]
  );
  return { success: true, message: "Permission assigned to role", statusCode: 201 };
};
