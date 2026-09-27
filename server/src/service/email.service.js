const nodemailer = require('nodemailer');

// Cấu hình "Trạm gửi thư" của bạn (Sử dụng Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Lấy từ file .env
        pass: process.env.EMAIL_PASS  // Lấy từ file .env
    }
});

// Hàm gửi mã OTP qua Email
const sendOTPEmail = async (emailTo, otpCode) => {
    try {
        const mailOptions = {
            from: `"GameFit Support" <${process.env.EMAIL_USER}>`,
            to: emailTo,
            subject: 'Thiết lập lại mật khẩu GameFit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #4CAF50; text-align: center;">Yêu cầu Đổi Mật Khẩu</h2>
                    <p>Chào bạn,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>
                    <p>Mã OTP xác thực của bạn là:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${otpCode}</span>
                    </div>
                    <p><i>Lưu ý: Mã này chỉ có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</i></p>
                    <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br/>Đội ngũ GameFit</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Đã gửi email OTP thành công tới: ' + info.accepted);
        return true;
    } catch (error) {
        console.error('Lỗi khi gửi email:', error.message);
        throw new Error('Không thể gửi mã xác thực qua Email. Vui lòng thử lại sau.');
    }
};

module.exports = {
    sendOTPEmail
};
