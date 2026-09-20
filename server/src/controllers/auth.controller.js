/**
 * Auth Controller - Xử lý đăng ký, đăng nhập và thông tin tài khoản
 */

exports.register = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    // TODO: Validate input & hash password & save to DB
    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: { fullname, email, role: "user" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // TODO: Verify credentials & generate JWT token
    const token = "mock_jwt_token_gamefit";
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        token,
        user: { fullname: "GameFit Player", email, role: "user" },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
