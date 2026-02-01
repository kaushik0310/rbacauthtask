const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const rbac = require("../middleware/rbac.middleware");
const userCtrl = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Current user profile (VIEW_OWN_PROFILE)
 *
 * @swagger
 * /users/me:
 *   get:
 *     tags: [User]
 *     summary: Get my profile.
 *     description: Returns the current logged-in user's profile. Requires VIEW_OWN_PROFILE permission (e.g. USER role). Access token required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role_id:
 *                       type: integer
 *                     role:
 *                       type: string
 *                       nullable: true
 *                     mfa_enabled:
 *                       type: boolean
 *       401:
 *         description: Unauthorized (missing or invalid access token).
 *       403:
 *         description: Forbidden (missing VIEW_OWN_PROFILE permission).
 *       404:
 *         description: User not found.
 */
router.get("/me", auth, rbac("VIEW_OWN_PROFILE"), userCtrl.getMyProfile);

module.exports = router;
