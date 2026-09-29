const authService = require('../service/auth.service');

const register = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin (username, password, email)' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' });
        }

        // Ép cứng role là 'User' (Bảo mật: ngăn chặn hacker gửi body có role='Admin')
        const result = await authService.registerUser(username, password, email, 'User');

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            user_id: result.user_id
        });
    } catch (error) {
        console.error('Error in register Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập username và password' });
        }

        const result = await authService.loginUser(username, password);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        console.error('Error in login Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email của bạn' });
        }

        const result = await authService.forgotPassword(email);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in forgotPassword Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xử lý quên mật khẩu' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đủ email, mã OTP và mật khẩu mới' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự' });
        }

        const result = await authService.resetPassword(email, otp, newPassword);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in resetPassword Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đặt lại mật khẩu' });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
