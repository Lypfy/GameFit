const { sql } = require("../config/db");

/**
 * Lấy danh sách thông báo của người dùng
 * @param {number} userId 
 * @param {number} limit 
 */
const getUserNotifications = async (userId, limit = 20) => {
  try {
    const request = new sql.Request();
    request.input("user_id", sql.Int, userId);
    request.input("limit", sql.Int, limit);

    const result = await request.execute("sp_GetUserNotifications");
    return { success: true, data: result.recordset || [] };
  } catch (error) {
    console.error("Error in getUserNotifications service:", error.message);
    throw new Error(error.message);
  }
};

/**
 * Lấy số lượng thông báo chưa đọc của người dùng
 * @param {number} userId 
 */
const getUnreadNotificationCount = async (userId) => {
  try {
    const request = new sql.Request();
    request.input("user_id", sql.Int, userId);

    const result = await request.execute("sp_GetUnreadNotificationCount");
    const unreadCount = result.recordset?.[0]?.unread_count || 0;
    return { success: true, count: unreadCount };
  } catch (error) {
    console.error("Error in getUnreadNotificationCount service:", error.message);
    throw new Error(error.message);
  }
};

/**
 * Đánh dấu thông báo đã đọc (1 thông báo hoặc tất cả)
 * @param {number} userId 
 * @param {number|null} notificationId 
 */
const markNotificationAsRead = async (userId, notificationId = null) => {
  try {
    const request = new sql.Request();
    request.input("user_id", sql.Int, userId);
    if (notificationId) {
      request.input("notification_id", sql.Int, notificationId);
    } else {
      request.input("notification_id", sql.Int, null);
    }

    const result = await request.execute("sp_MarkNotificationAsRead");
    const affected = result.recordset?.[0]?.affected_rows || 0;
    return { success: true, affectedRows: affected };
  } catch (error) {
    console.error("Error in markNotificationAsRead service:", error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
};
