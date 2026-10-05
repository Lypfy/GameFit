const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  connectionTimeout: 30000,
  requestTimeout: 30000,
  options: {
    encrypt: true, // Bắt buộc khi kết nối Azure SQL Database
    trustServerCertificate: false,
    enableKeepAlive: true, // Tránh lỗi socket hang up (ECONNRESET) trên Azure
    keepAliveInitialDelay: 10000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

/**
 * Khởi tạo kết nối tới Azure SQL Database
 */
const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Đã kết nối thành công tới Azure SQL Database!');
    return pool;
  } catch (err) {
    console.error('❌ Lỗi kết nối Azure SQL Database:', err.message);
    process.exit(1);
  }
};

module.exports = { sql, connectDB };
