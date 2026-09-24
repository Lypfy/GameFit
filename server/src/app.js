const express = require('express');
require('dotenv').config();
const { connectDB, sql } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// API route thử nghiệm kết nối DB
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await sql.query`SELECT @@VERSION AS azure_version, CURRENT_TIMESTAMP AS current_time`;
    res.json({
      success: true,
      message: 'Kết nối Azure SQL Database thành công!',
      data: result.recordset[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi truy vấn Database',
      error: err.message
    });
  }
});

// Khởi tạo kết nối DB trước khi lắng nghe port
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server GameFit đang chạy tại: http://localhost:${PORT}`);
  });
});
