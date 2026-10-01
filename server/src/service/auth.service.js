const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (username, password, email, role = 'User') => {
    try {
        const request = new sql.Request();

        // 1. Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Truyền tham số khớp với Stored Procedure
        request.input('user_name', sql.VarChar, username);
        request.input('email', sql.VarChar, email);
        request.input('password', sql.VarChar, hashedPassword);

        // 3. Thực thi Stored Procedure
        const result = await request.execute('sp_Register');

        return {
            success: true,
            user_id: result.recordset[0].user_id,
            role: role
        };
    }
    catch (error) {
        console.error('Error in registerUser Service:', error.message);

        // 4. Bắt lỗi RAISERROR từ SQL Server
        if (error.message.includes('Email này đã có người dùng') || error.message.includes('Tên này đã có người sử dụng')) {
            return { success: false, message: error.message };
        }

        throw new Error('Lỗi khi đăng ký người dùng');
    }
};

const loginUser = async (username, password) => {
    try {
        const request = new sql.Request();
        request.input('username', username);

        // 1. Tìm user trong DB theo user_name HOẶC email (Cho phép khách đăng nhập bằng 1 trong 2)
        const result = await request.query('SELECT * FROM Users WHERE user_name = @username OR email = @username');
        const user = result.recordset[0];

        if (!user) {
            return { success: false, message: 'Tài khoản không tồn tại' };
        }

        // 2. Kiểm tra tài khoản có bị khóa không
        if (user.status === 'Locked') {
            return { success: false, message: 'Tài khoản của bạn đã bị khóa' };
        }

        // 3. So sánh mật khẩu đã hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { success: false, message: 'Mật khẩu không chính xác' };
        }

        // 4. Tạo Token JWT có chứa Role
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.user_name, // Trả về user_name theo DB
                role: user.role || 'User'
            },
            process.env.JWT_SECRET || 'GAMEFIT_SECRET_KEY',
            { expiresIn: '1d' }
        );

        return {
            success: true,
            token: token,
            user: {
                user_id: user.user_id,
                username: user.user_name,
                email: user.email,
                role: user.role || 'User',
                status: user.status
            }
        };
    }
    catch (error) {
        console.error('Error in loginUser Service:', error.message);
        throw new Error('Lỗi khi đăng nhập');
    }
};

// ======================= LOGIC LẤY LẠI MẬT KHẨU =======================
// Lưu trữ mã OTP trên RAM (Tự động xóa sau khi khởi động lại server hoặc xoá thủ công)
const otpCache = new Map();
const emailService = require('./email.service');

const forgotPassword = async (email) => {
    try {
        const request = new sql.Request();
        request.input('email', email);

        // 1. Kiểm tra email có tồn tại không
        const checkUser = await request.query('SELECT user_id FROM Users WHERE email = @email');
        if (checkUser.recordset.length === 0) {
            return { success: false, message: 'Email này chưa được đăng ký trong hệ thống' };
        }

        // 2. Tạo mã OTP ngẫu nhiên (6 chữ số)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Lưu OTP vào bộ nhớ đệm (Gắn kèm thời gian hết hạn sau 5 phút nếu muốn làm nâng cao, ở đây tạm lưu cứng)
        otpCache.set(email, otpCode);

        // 4. Gửi email
        await emailService.sendOTPEmail(email, otpCode);

        // Hẹn giờ tự động huỷ OTP sau 5 phút (300000 milliseconds)
        setTimeout(() => {
            otpCache.delete(email);
        }, 300000);

        return { success: true, message: 'Mã xác minh đã được gửi đến email của bạn' };
    } catch (error) {
        console.error('Error in forgotPassword Service:', error.message);
        throw new Error('Lỗi khi gửi yêu cầu quên mật khẩu');
    }
};

const resetPassword = async (email, otp, newPassword) => {
    try {
        // 1. Kiểm tra mã OTP
        const storedOTP = otpCache.get(email);
        if (!storedOTP || storedOTP !== otp.toString()) {
            return { success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' };
        }

        // 2. Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Cập nhật vào DB
        const request = new sql.Request();
        request.input('password', hashedPassword);
        request.input('email', email);
        await request.query('UPDATE Users SET password = @password WHERE email = @email');

        // 4. Xóa OTP khỏi bộ nhớ để tránh dùng lại
        otpCache.delete(email);

        return { success: true, message: 'Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập.' };
    } catch (error) {
        console.error('Error in resetPassword Service:', error.message);
        throw new Error('Lỗi khi cập nhật mật khẩu mới');
    }
};

const updateUserProfile = async (userId, newUsername, newPassword = null) => {
    try {
        const checkReq = new sql.Request();
        checkReq.input('user_id', sql.Int, userId);
        checkReq.input('new_user_name', sql.VarChar, newUsername);

        // 1. Kiểm tra xem user_name đã bị tài khoản khác sử dụng chưa
        const checkResult = await checkReq.query(
            'SELECT 1 FROM Users WHERE user_name = @new_user_name AND user_id != @user_id'
        );
        if (checkResult.recordset && checkResult.recordset.length > 0) {
            return { success: false, message: 'Tên người dùng này đã có người sử dụng' };
        }

        // 2. Thực thi Stored Procedure sp_UpdateInformationAccount
        const updateReq = new sql.Request();
        updateReq.input('user_id', sql.Int, userId);
        updateReq.input('new_user_name', sql.VarChar, newUsername);
        updateReq.input('new_email', sql.VarChar, null);
        await updateReq.execute('sp_UpdateInformationAccount');

        // 3. Nếu người dùng muốn đổi cả mật khẩu
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            const pwdReq = new sql.Request();
            pwdReq.input('user_id', sql.Int, userId);
            pwdReq.input('password', sql.VarChar, hashedPassword);
            await pwdReq.query('UPDATE Users SET password = @password WHERE user_id = @user_id');
        }

        // 4. Lấy thông tin mới nhất trả về
        const userReq = new sql.Request();
        userReq.input('user_id', sql.Int, userId);
        const userRes = await userReq.query('SELECT user_id, user_name, email, role, status FROM Users WHERE user_id = @user_id');
        const updatedUser = userRes.recordset[0];

        return {
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: {
                user_id: updatedUser.user_id,
                username: updatedUser.user_name,
                user_name: updatedUser.user_name,
                email: updatedUser.email,
                role: updatedUser.role || 'User',
                status: updatedUser.status
            }
        };
    } catch (error) {
        console.error('Error in updateUserProfile Service:', error.message);
        if (
            // Dùng để bắt lỗi khi HQTCSDL trả về thông báo bị lỗi font
            error.message.includes('Tên này đã có người sử dụng') ||
            error.message.includes('ngu?i s? d?ng') ||
            error.message.toLowerCase().includes('người sử dụng')
        ) {
            return { success: false, message: 'Tên người dùng này đã có người sử dụng' };
        }
        return { success: false, message: error.message || 'Lỗi khi cập nhật thông tin người dùng' };
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    updateUserProfile
};
