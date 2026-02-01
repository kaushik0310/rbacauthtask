const adminService = require("../services/admin.service");

exports.createUser = async (req, res) => {
  try {
    const { email, password: pwd, role } = req.body;
    const result = await adminService.createUser(email, pwd, role);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }
    return res.status(201).json({ success: true, message: result.message });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const result = await adminService.listUsers();
    res.json({ users: result.users });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;
    const result = await adminService.deleteUser(userId, currentUserId);

    if (!result.success) {
      const code = result.statusCode === 400 ? "SELF_DELETE" : "NOT_FOUND";
      return res.status(result.statusCode).json({ error: result.message, code });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
  }
};
