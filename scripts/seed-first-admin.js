#!/usr/bin/env node
/**
 * Seed the first admin user. Run once after schema is applied.
 * Requires env: FIRST_ADMIN_EMAIL, FIRST_ADMIN_PASSWORD, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 * Example: FIRST_ADMIN_EMAIL=admin@example.com FIRST_ADMIN_PASSWORD=SecurePass123 node scripts/seed-first-admin.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const path = require("path");

// Load password util from project (same hashing as auth)
const password = require(path.join(__dirname, "..", "src", "utils", "password"));

const EMAIL = process.env.FIRST_ADMIN_EMAIL;
const PWD = process.env.FIRST_ADMIN_PASSWORD;
const ROLE_ID_ADMIN = 1;

async function seed() {
  if (!EMAIL || !PWD) {
    console.error(
      "Set FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD in .env or env. Example:\n" +
        "  FIRST_ADMIN_EMAIL=admin@example.com FIRST_ADMIN_PASSWORD=YourSecurePass123 node scripts/seed-first-admin.js"
    );
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    const [[existing]] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [EMAIL]
    );
    if (existing) {
      console.log("First admin already exists for:", EMAIL);
      await pool.end();
      process.exit(0);
    }

    const hash = await password.hash(PWD);
    await pool.execute(
      "INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)",
      [EMAIL, hash, ROLE_ID_ADMIN]
    );
    console.log("First admin created:", EMAIL, "(role_id = 1, ADMIN)");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
