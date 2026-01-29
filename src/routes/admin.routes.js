const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const rbac = require("../middleware/rbac.middleware");
const highPrivilege = require("../middleware/highPrivilege.middleware");
const db = require("../config/db");

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin-only routes (RBAC and high-privilege with OTP)
 *
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users.
 *     description: Returns a list of users. Requires permission VIEW_USERS (e.g. ADMIN role). Access token required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       role_id:
 *                         type: integer
 *                       mfa_enabled:
 *                         type: boolean
 *       401:
 *         description: Unauthorized (missing or invalid access token).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       403:
 *         description: Forbidden (missing VIEW_USERS permission).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 */
router.get("/users", auth, rbac("VIEW_USERS"), async (req, res) => {
  const [rows] = await db.execute(
    "SELECT u.id, u.email, u.role_id, u.mfa_enabled FROM users u"
  );
  res.json({ users: rows });
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user (high-privilege).
 *     description: Deletes a user by id. Requires permission DELETE_USER and a valid OTP (MFA must be enabled). Send OTP in body.otp or header x-otp. Cannot delete yourself.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id to delete.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 description: TOTP code (or send in header x-otp).
 *     responses:
 *       200:
 *         description: User deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted"
 *       400:
 *         description: OTP required or attempting to delete yourself.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       401:
 *         description: Invalid OTP or unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       403:
 *         description: Forbidden or MFA not enabled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 */
router.delete(
  "/users/:id",
  auth,
  highPrivilege("DELETE_USER"),
  async (req, res) => {
    const userId = req.params.id;
    if (userId === String(req.user.id)) {
      return res.status(400).json({ error: "Cannot delete yourself", code: "SELF_DELETE" });
    }
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [
      userId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    res.json({ message: "User deleted" });
  }
);

module.exports = router;
