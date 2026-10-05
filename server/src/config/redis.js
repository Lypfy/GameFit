require('dotenv').config();
const redis = require('redis');

// Lấy Connection String từ .env, nếu không có thì dùng localhost mặc định
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = redis.createClient({
  url: REDIS_URL,
  socket: {
    tls: REDIS_URL.startsWith('rediss://') // Bật TLS tự động nếu dùng Upstash (rediss)
  }
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Đã kết nối thành công tới Redis!'));

// Hàm kết nối
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('❌ Không thể kết nối Redis:', err.message);
  }
};

module.exports = { redisClient, connectRedis };
