exports.sendError = (res, status, message, code = null) => {
  const body = { error: message };
  if (code) body.code = code;
  return res.status(status).json(body);
};
