const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const rbac = require("../middleware/rbac.middleware");
const highPrivilege = require("../middleware/highPrivilege.middleware");
const adminCtrl = require("../controllers/admin.controller");
const { adminCreateUserRules, validate } = require("../utils/authValidations");

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
router.post(
  "/users",
  auth,
  rbac("CHANGE_ROLE"),
  adminCreateUserRules,
  validate,
  adminCtrl.createUser
);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create a user (admin or regular).
 *     description: Only admins with CHANGE_ROLE permission can create users. Use this to add new admins or regular users. Public register always creates USER; this endpoint allows creating ADMIN.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin2@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Min 8 characters
 *                 example: "securePassword123"
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *                 description: Role to assign to the new user.
 *     responses:
 *       201:
 *         description: User created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User created"
 *       400:
 *         description: Validation failed, invalid role, or email already registered.
 *       401:
 *         description: Unauthorized (missing or invalid access token).
 *       403:
 *         description: Forbidden (missing CHANGE_ROLE permission).
 */
router.get("/users", auth, rbac("VIEW_USERS"), adminCtrl.listUsers);

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
  adminCtrl.deleteUser
);

module.exports = router;
