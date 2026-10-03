const jwt = require("jsonwebtoken");
const { sql } = require("../config/db");

const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Tách "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Truy cập bị từ chối! Không tìm thấy Token.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "GAMEFIT_SECRET_KEY",
    );
    req.user = decoded; // Lưu thông tin user vào req

    // Kiểm tra trực tiếp trạng thái tài khoản trong CSDL
    const pool = await sql.connect();
    const userRes = await pool
      .request()
      .input("user_id", sql.Int, decoded.user_id)
      .query(
        "SELECT user_id, status, lock_until, lock_reason FROM Users WHERE user_id = @user_id",
      );

    const user = userRes.recordset[0];
    if (!user) {
      return res.status(401).json({
        success: false,
        isLocked: true,
        message: "Tài khoản không tồn tại!",
      });
    }

    if (user.status === "Locked") {
      // Kiểm tra xem thời hạn khóa đã hết hay chưa
      if (user.lock_until && new Date(user.lock_until) <= new Date()) {
        // Tự động mở khóa nếu quá hạn
        await pool
          .request()
          .input("user_id", sql.Int, user.user_id)
          .query(
            "UPDATE Users SET status = 'Active', lock_until = NULL, lock_reason = NULL WHERE user_id = @user_id",
          );
      } else {
        let msg = "Tài khoản của bạn đã bị khóa bởi Quản trị viên!";
        if (user.lock_reason) msg += ` Lý do: ${user.lock_reason}.`;
        return res.status(403).json({
          success: false,
          isLocked: true,
          message: msg,
        });
      }
    }

    next(); // Cho phép đi tiếp
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

// Hàm kiểm tra quyền (Role)
// VD: router.delete('/', verifyToken, verifyRole(['admin']), deleteComputerConfig);
const verifyRole = (rolesArray) => {
  return (req, res, next) => {
    if (!req.user || !rolesArray.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Quyền truy cập bị từ chối! Bạn không có quyền thực hiện chức năng này.",
      });
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };
