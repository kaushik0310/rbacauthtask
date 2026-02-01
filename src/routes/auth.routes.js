const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const mfaCtrl = require("../controllers/mfa.controller");
const auth = require("../middleware/auth.middleware");
const {
  validate,
  registerRules,
  loginRules,
  refreshRules,
  mfaVerifyRules,
} = require("../utils/authValidations");

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication (register, login, refresh)
 *   - name: MFA
 *     description: Multi-factor authentication setup and verify
 *
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user.
 *     description: Creates a new user with email and password. Email and password are mandatory. Default role is applied from config.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user.
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (min 8 characters).
 *                 example: "strongPassword123"
 *     responses:
 *       201:
 *         description: Registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registered successfully"
 *       400:
 *         description: Validation error or email already registered.
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
router.post("/register", registerRules, validate, ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login (returns tokens or requires MFA).
 *     description: Authenticates with email and password. If MFA is enabled, first call returns requiresMfa true; send same credentials with otp to complete login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "strongPassword123"
 *               otp:
 *                 type: string
 *                 description: TOTP code when MFA is enabled (required on second step).
 *     responses:
 *       200:
 *         description: Success. Either tokens or requires MFA.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: string
 *                       example: "15m"
 *                 - type: object
 *                   properties:
 *                     requiresMfa:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Invalid credentials or invalid OTP.
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
router.post("/login", loginRules, validate, ctrl.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange refresh token for new access and refresh tokens.
 *     description: Send the refresh token received at login to get a new access token and a new refresh token. Old refresh token is invalidated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token from login or previous refresh.
 *     responses:
 *       200:
 *         description: New tokens issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                   example: "15m"
 *       400:
 *         description: Refresh token missing.
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
 *         description: Invalid or expired refresh token.
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
router.post("/refresh", refreshRules, validate, ctrl.refresh);

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     tags: [MFA]
 *     summary: Step 1 – Generate MFA secret and return otpauth URL.
 *     description: Call this to start MFA setup. Returns an otpauth URL to scan with an authenticator app. MFA is not enabled until you call /auth/mfa/verify with a valid OTP.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: otpauth URL for authenticator app.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 otpAuthUrl:
 *                   type: string
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
 */
router.post("/mfa/setup", auth, mfaCtrl.enableMFA);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     tags: [MFA]
 *     summary: Step 2 – Verify OTP and enable MFA.
 *     description: After scanning the QR from /auth/mfa/setup, send the current TOTP code from your app. On success, MFA is enabled for the account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: Current TOTP code from authenticator app.
 *     responses:
 *       200:
 *         description: MFA enabled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "MFA enabled successfully"
 *       400:
 *         description: OTP required or MFA setup not started.
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
 */
router.post("/mfa/verify", auth, mfaVerifyRules, validate, mfaCtrl.verifyMFA);

module.exports = router;
