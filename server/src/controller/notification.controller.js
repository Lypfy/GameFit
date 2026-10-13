const notificationService = require("../service/notification.service");

/**
 * Controller: Lấy danh sách thông báo
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Người dùng chưa xác thực" });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await notificationService.getUserNotifications(userId, limit);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller: Lấy số lượng thông báo chưa đọc
 */
const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Người dùng chưa xác thực" });
    }

    const result = await notificationService.getUnreadNotificationCount(userId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller: Đánh dấu đã đọc
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Người dùng chưa xác thực" });
    }

    const notificationId = req.body?.notification_id ? parseInt(req.body.notification_id, 10) : null;
    const result = await notificationService.markNotificationAsRead(userId, notificationId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
};
