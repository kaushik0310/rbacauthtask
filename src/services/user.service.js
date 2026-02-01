const getPool = () => {
  const pool = global.pool;
  if (!pool) throw new Error("Database pool not initialized");
  return pool;
};

/**
 * Get the current user's profile by user id (for GET /users/me).
 * @param {number} userId - Logged-in user id (req.user.id)
 * @returns {{ success: true, profile: object }} | {{ success: false, message: string, statusCode: number }}
 */
exports.getMyProfile = async (userId) => {
  const pool = getPool();

  const [[user]] = await pool.execute(
    `SELECT u.id, u.email, u.role_id, u.mfa_enabled, r.name AS role
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [userId]
  );

  if (!user) {
    return { success: false, message: "User not found", statusCode: 404 };
  }

  return {
    success: true,
    profile: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role: user.role || null,
      mfa_enabled: Boolean(user.mfa_enabled),
    },
  };
};
