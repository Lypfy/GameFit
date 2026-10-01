const statisticsService = require("../service/statistics.service");

/**
 * Controller: Lấy thống kê Wishlist
 */
const getWishlistStats = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const data = await statisticsService.getWishlistStatistics(limit);

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê Wishlist thành công",
      data,
    });
  } catch (error) {
    console.error("Error in getWishlistStats Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy thống kê Wishlist",
      error: error.message,
    });
  }
};

/**
 * Controller: Lấy thống kê Phần cứng
 */
const getHardwareStats = async (req, res) => {
  try {
    const data = await statisticsService.getHardwareStatistics();

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê Phần cứng thành công",
      data,
    });
  } catch (error) {
    console.error("Error in getHardwareStats Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy thống kê Phần cứng",
      error: error.message,
    });
  }
};

/**
 * Controller: Lấy thống kê Thể loại
 */
const getGenreStats = async (req, res) => {
  try {
    const data = await statisticsService.getGenreStatistics();

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê Thể loại thành công",
      data,
    });
  } catch (error) {
    console.error("Error in getGenreStats Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy thống kê Thể loại",
      error: error.message,
    });
  }
};

/**
 * Controller: Lấy thống kê Tổng quan (Tab 1)
 */
const getGeneralStats = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const data = await statisticsService.getGeneralStatistics(limit);

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu thống kê Tổng quan thành công",
      data,
    });
  } catch (error) {
    console.error("Error in getGeneralStats Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy thống kê Tổng quan",
      error: error.message,
    });
  }
};

module.exports = {
  getGeneralStats,
  getWishlistStats,
  getHardwareStats,
  getGenreStats,
};

