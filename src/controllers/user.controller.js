const userService = require("../services/user.service");

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await userService.getMyProfile(userId);

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }
    res.json({ success: true, data: result.profile });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server Error", code: "SERVER_ERROR" });
  }
};
