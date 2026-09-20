const jwt = require("jsonwebtoken");

/**
 * Middleware xác thực token JWT của người dùng
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để tiếp tục!",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!",
    });
  }
};

/**
 * Middleware kiểm tra quyền Quản trị viên (Admin)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập vào tài nguyên này!",
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
};
