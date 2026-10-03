const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Route Đăng ký (Register)
router.post("/register", authController.register);

// Route Đăng nhập (Login)
router.post("/login", authController.login);

// Route Yêu cầu quên mật khẩu (Gửi email chứa OTP)
router.post("/forgot-password", authController.forgotPassword);

// Route Đặt lại mật khẩu (Nhập OTP và mật khẩu mới)
router.post("/reset-password", authController.resetPassword);

// Route Cập nhật thông tin cá nhân (Tên người dùng, mật khẩu)
router.put("/profile", verifyToken, authController.updateProfile);

// Route Kiểm tra trạng thái tài khoản thời gian thực
router.get("/check-status", verifyToken, (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

// Route Lấy danh sách người dùng (Admin Dashboard)
router.get("/users", authController.getUsers);

// Route Admin Thêm người dùng mới
router.post("/admin/add-user", authController.adminAddUser);

// Route Admin Khóa / Mở khóa tài khoản người dùng
router.post("/admin/lock-user", authController.lockUnlockUser);

module.exports = router;
