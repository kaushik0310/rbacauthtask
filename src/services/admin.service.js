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
