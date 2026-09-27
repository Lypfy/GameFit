const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Tách "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Truy cập bị từ chối! Không tìm thấy Token.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'GAMEFIT_SECRET_KEY');
        req.user = decoded; // Lưu thông tin user vào req để dùng cho các controller phía sau
        next(); // Cho phép đi tiếp
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

// Hàm kiểm tra quyền (Role)
// VD: router.delete('/', verifyToken, verifyRole(['admin']), deleteComputerConfig);
const verifyRole = (rolesArray) => {
    return (req, res, next) => {
        if (!req.user || !rolesArray.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Quyền truy cập bị từ chối! Bạn không có quyền thực hiện chức năng này.' 
            });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole };
