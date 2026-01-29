const jwt = require("jsonwebtoken");
const { accessSecret } = require("../config/jwt");
const { sendError } = require("../utils/errors");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return sendError(res, 401, "Unauthorized", "TOKEN_MISSING");
  }

  jwt.verify(token, accessSecret, (err, user) => {
    if (err) {
      return sendError(res, 401, "Invalid or expired token", "TOKEN_INVALID");
    }
    req.user = user;
    next();
  });
};
