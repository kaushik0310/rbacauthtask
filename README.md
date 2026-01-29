# rbacauthtask

Node/Express API for auth with JWT, RBAC (roles/permissions), and TOTP MFA. Uses MySQL for storage.

## What it does

- User registration and login (email + password). Passwords are hashed with bcrypt.
- Access and refresh tokens (JWT). Refresh tokens are stored as hashes in the DB.
- Role-based access: roles and permissions in DB. Admin routes check permissions (VIEW_USERS, DELETE_USER, CHANGE_ROLE).
- Optional MFA: user can enable TOTP (e.g. Google Authenticator). Setup and verify endpoints are there.
- High-privilege actions (delete user, change role) require an OTP in addition to the access token.
- Rate limiting on auth endpoints and a general limiter on the app.
- Swagger docs at `/api-docs`.

## Setup

1. Clone and `npm install`.
2. Create a MySQL database and run `schema.sql` to create tables and seed roles/permissions.
3. Copy env vars you need. The app uses:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (defaults in db.js if not set)
   - `ACCESS_SECRET`, `REFRESH_SECRET` for JWT (no defaults, set these)
   - `DEFAULT_ROLE_ID` (optional, default 2 for USER)
   - `CORS_ORIGIN` (optional)
4. Run with `npm run dev` (nodemon) or `npm run prod`.

Server runs on port 9766 (see server.js).

## Main routes

- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- **MFA:** `POST /auth/mfa/setup`, `POST /auth/mfa/verify`, `POST /auth/mfa/disable` (with auth)
- **Admin (need token + permission):** `GET /admin/users`, `DELETE /admin/users/:id`, `PATCH /admin/users/:id/role`. Delete and change-role require the high-privilege OTP as well.

Check the route files or Swagger for request/response shapes.

## Tech

Express 5, mysql2, jsonwebtoken, bcrypt, speakeasy (TOTP), express-validator, helmet, cors, express-rate-limit. Swagger via swagger-jsdoc and swagger-ui-express.
