const db = require("../config/db");
const { sendError } = require("../utils/errors");

module.exports = (permission) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 403, "Forbidden", "FORBIDDEN");
    }

    const [[roleRow]] = await db.execute(
      "SELECT id FROM roles WHERE name = ?",
      [req.user.role]
    );
    if (!roleRow) {
      return sendError(res, 403, "Forbidden", "FORBIDDEN");
    }

    const [permRows] = await db.execute(
      `SELECT p.name FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.name = ?`,
      [roleRow.id, permission]
    );

    if (!permRows || permRows.length === 0) {
      return sendError(res, 403, "Forbidden", "FORBIDDEN");
    }

    next();
  };
};
