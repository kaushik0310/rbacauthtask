const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

const app = express();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "RBAC Auth API (JWT + MFA)",
    version: "1.0.0",
    description: "Secure authentication and authorization with JWT, RBAC, and TOTP MFA.",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const swaggerSpec = swaggerJSDoc({
  swaggerDefinition,
  apis: [path.join(__dirname, "routes", "**", "*.js")],
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests", code: "RATE_LIMIT" },
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many auth attempts", code: "RATE_LIMIT" },
});
app.use("/auth/login", authLimiter);
app.use("/auth/register", authLimiter);
app.use("/auth/refresh", authLimiter);

app.use("/auth", require("./routes/auth.routes"));
app.use("/admin", require("./routes/admin.routes"));

module.exports = app;
