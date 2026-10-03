const authService = require("../service/auth.service");

const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin (username, password, email)",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có độ dài tối thiểu 8 ký tự",
      });
    }

    // Ép cứng role là 'User' (Bảo mật: ngăn chặn hacker gửi body có role='Admin')
    const result = await authService.registerUser(
      username,
      password,
      email,
      "User",
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      user_id: result.user_id,
    });
  } catch (error) {
    console.error("Error in register Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi đăng ký" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập username và password",
      });
    }

    const result = await authService.loginUser(username, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Error in login Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi đăng nhập" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp email của bạn" });
    }

    const result = await authService.forgotPassword(email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in forgotPassword Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xử lý quên mật khẩu" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đủ email, mã OTP và mật khẩu mới",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có độ dài tối thiểu 8 ký tự",
      });
    }

    const result = await authService.resetPassword(email, otp, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in resetPassword Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi đặt lại mật khẩu" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Người dùng chưa đăng nhập" });
    }

    const { username, password } = req.body;
    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tên người dùng" });
    }

    const result = await authService.updateUserProfile(
      userId,
      username.trim(),
      password && password.trim() ? password.trim() : null,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateProfile Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi cập nhật thông tin",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { keyword, role, status } = req.query;
    const result = await authService.getUsers(
      keyword ? keyword.trim() : null,
      role ? role.trim() : null,
      status ? status.trim() : null,
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getUsers Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách người dùng",
    });
  }
};

const adminAddUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tên người dùng" });
    }
    if (!email || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập địa chỉ email" });
    }
    if (!password || !password.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập mật khẩu" });
    }

    const result = await authService.adminAddUser(
      username.trim(),
      email.trim(),
      password.trim(),
      role || "User",
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in adminAddUser Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi thêm người dùng",
    });
  }
};

const lockUnlockUser = async (req, res) => {
  try {
    const { userId, status, lockReason, lockUntil } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu mã người dùng (userId)" });
    }
    if (!status || !["Active", "Locked"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    if (
      req.user &&
      Number(req.user.user_id) === Number(userId) &&
      status === "Locked"
    ) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể tự khóa tài khoản của chính mình!",
      });
    }

    const result = await authService.lockUnlockUser(
      userId,
      status,
      lockReason ? lockReason.trim() : null,
      lockUntil || null,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in lockUnlockUser Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi cập nhật trạng thái tài khoản",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  getUsers,
  adminAddUser,
  lockUnlockUser,
};
