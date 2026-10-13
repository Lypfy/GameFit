const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Lấy danh sách thông báo của người dùng
router.get("/", verifyToken, notificationController.getUserNotifications);

// Lấy số lượng thông báo chưa đọc
router.get("/unread-count", verifyToken, notificationController.getUnreadNotificationCount);

// Đánh dấu đã đọc (1 thông báo hoặc tất cả)
router.put("/read", verifyToken, notificationController.markNotificationAsRead);

module.exports = router;
