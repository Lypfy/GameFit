const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

// Route Đăng ký (Register)
router.post('/register', authController.register);

// Route Đăng nhập (Login)
router.post('/login', authController.login);

// Route Yêu cầu quên mật khẩu (Gửi email chứa OTP)
router.post('/forgot-password', authController.forgotPassword);

// Route Đặt lại mật khẩu (Nhập OTP và mật khẩu mới)
router.post('/reset-password', authController.resetPassword);

module.exports = router;
