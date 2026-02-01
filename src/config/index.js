module.exports = {
  defaultRoleId: parseInt(process.env.DEFAULT_ROLE_ID || "2", 10),
  Port: process.env.PORT || 9766,
};
