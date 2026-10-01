const { sql } = require("../config/db");

/**
 * Lấy thống kê về Wishlist qua Stored Procedure dbo.sp_GetWishlistStatistics:
 * - Top các game được thêm vào Wishlist nhiều nhất
 * - Tổng số lượt wishlist trên toàn hệ thống
 */
const getWishlistStatistics = async (limit = 20) => {
  try {
    const pool = await sql.connect();
    const req = pool.request();
    req.input("limit", sql.Int, limit);

    const result = await req.execute("dbo.sp_GetWishlistStatistics");

    const summary = result.recordsets[0]?.[0] || {
      total_wishlist_items: 0,
      total_games_in_wishlist: 0,
      total_users_with_wishlist: 0,
    };
    const topGames = result.recordsets[1] || [];
    const topReviewedGames = result.recordsets[2] || [];

    return {
      summary,
      topGames,
      topReviewedGames,
    };
  } catch (error) {
    console.error("Error in getWishlistStatistics Service:", error.message);
    throw new Error("Lỗi khi lấy dữ liệu thống kê Wishlist từ Stored Procedure");
  }
};

/**
 * Lấy thống kê Phần cứng (Hardware Insights) qua Stored Procedure dbo.sp_GetHardwareStatistics:
 * - Tổng số lượng CPU & GPU trong hệ thống
 * - Top CPU & GPU phổ biến được người dùng lưu trong cấu hình máy (User_pc)
 * - Tỷ lệ thị phần thương hiệu GPU (NVIDIA, AMD, Intel...)
 * - Tỷ lệ thị phần thương hiệu CPU (Intel, AMD)
 * - Phân bố dung lượng RAM (8GB, 12GB, 16GB, >= 32GB)
 */
const getHardwareStatistics = async (limit = 20) => {
  try {
    const pool = await sql.connect();
    const req = pool.request();
    req.input("limit", sql.Int, limit);

    const result = await req.execute("dbo.sp_GetHardwareStatistics");

    const totals = result.recordsets[0]?.[0] || {
      total_cpus: 0,
      total_gpus: 0,
      total_user_pcs: 0,
    };
    const cpuMarketShare = result.recordsets[1] || [];
    const gpuMarketShare = result.recordsets[2] || [];
    const topCpus = result.recordsets[3] || [];
    const topGpus = result.recordsets[4] || [];
    const ramDistribution = result.recordsets[5] || [];

    return {
      totals,
      cpuMarketShare,
      gpuMarketShare,
      topCpus,
      topGpus,
      ramDistribution,
    };
  } catch (error) {
    console.error("Error in getHardwareStatistics Service:", error.message);
    throw new Error("Lỗi khi lấy dữ liệu thống kê Phần cứng từ Stored Procedure");
  }
};

/**
 * Lấy thống kê Thể loại (Genre Statistics) qua Stored Procedure dbo.sp_GetGenreStatistics:
 * - Thống kê số lượng game, lượt wishlist và điểm đánh giá trung bình theo từng thể loại
 */
const getGenreStatistics = async () => {
  try {
    const pool = await sql.connect();
    const req = pool.request();

    const result = await req.execute("dbo.sp_GetGenreStatistics");

    const totals = result.recordsets[0]?.[0] || {
      total_games: 0,
      total_genres: 0,
      total_wishlists: 0,
    };
    const genres = result.recordsets[1] || [];

    return {
      totals,
      genres,
    };
  } catch (error) {
    console.error("Error in getGenreStatistics Service:", error.message);
    throw new Error("Lỗi khi lấy dữ liệu thống kê Thể loại từ Stored Procedure");
  }
};

/**
 * Lấy thống kê Tổng quan (General Overview - Tab 1) qua Stored Procedure dbo.sp_GetGeneralStatistics
 */
const getGeneralStatistics = async (limit = 20) => {
  try {
    const pool = await sql.connect();
    const req = pool.request();
    req.input("limit", sql.Int, limit);

    const result = await req.execute("dbo.sp_GetGeneralStatistics");

    const totals = result.recordsets[0]?.[0] || {
      total_games: 0,
      active_games: 0,
      inactive_games: 0,
    };
    const timeline = result.recordsets[1] || [];
    const statusDistribution = result.recordsets[2] || [];
    const recentGames = result.recordsets[3] || [];

    return {
      totals,
      timeline,
      statusDistribution,
      recentGames,
    };
  } catch (error) {
    console.error("Error in getGeneralStatistics Service:", error.message);
    throw new Error("Lỗi khi lấy dữ liệu thống kê Tổng quan từ Stored Procedure");
  }
};

module.exports = {
  getGeneralStatistics,
  getWishlistStatistics,
  getHardwareStatistics,
  getGenreStatistics,
};
