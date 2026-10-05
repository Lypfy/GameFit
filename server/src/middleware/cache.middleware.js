const { redisClient } = require('../config/redis');

/**
 * Middleware cache dữ liệu API sử dụng Redis
 * @param {number} duration Thời gian sống của cache (giây) - mặc định 1 giờ (3600s)
 */
const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    // Chỉ cache method GET
    if (req.method !== 'GET') {
      return next();
    }

    // Tạo cache key dựa vào URL (ví dụ: /api/games?page=1)
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      if (!redisClient.isOpen) {
        return next();
      }

      // Kiểm tra xem có trong cache không
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        // Cache Hit: Trả về dữ liệu từ Redis
        // console.log(`⚡ Cache Hit: ${key}`);
        return res.json(JSON.parse(cachedResponse));
      } else {
        // Cache Miss: Chưa có trong Redis, chặn res.json để lưu cache
        // console.log(`🐌 Cache Miss: ${key}`);
        const originalJson = res.json.bind(res);

        res.json = (body) => {
          // Lưu vào Redis với thời hạn hết hạn
          if (body && body.success) { // Chỉ cache khi API lấy dữ liệu thành công
            redisClient.setEx(key, duration, JSON.stringify(body))
              .catch(err => console.error('Lỗi khi set cache:', err));
          }
          originalJson(body);
        };
        next();
      }
    } catch (error) {
      console.error('Redis cache error:', error);
      next(); // Bỏ qua lỗi cache để app không bị sập
    }
  };
};

/**
 * Middleware xóa toàn bộ cache của Games khi có dữ liệu thêm/sửa/xóa
 */
const clearGamesCache = async (req, res, next) => {
  next(); // Cho phép request chạy tiếp tới Controller ngay lập tức
  
  // Chạy ngầm việc xóa cache
  try {
    if (redisClient.isOpen) {
      // Tìm tất cả các key bắt đầu bằng cache:/api/games
      const keys = await redisClient.keys('cache:/api/games*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🧹 Đã xóa ${keys.length} bản ghi khỏi Redis Cache do có cập nhật dữ liệu game!`);
      }
    }
  } catch (err) {
    console.error('Lỗi khi xóa cache:', err);
  }
};

module.exports = { cacheMiddleware, clearGamesCache };
