const express = require('express');
require('dotenv').config();
const { connectDB, sql } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

app.use(express.json());

// Phục vụ các file tĩnh (Frontend: HTML, CSS, JS) từ thư mục client
app.use(express.static(path.join(__dirname, '../../client')));

// Tự động chuyển hướng khi người dùng gõ localhost:5000
app.get('/', (req, res) => {
  res.redirect('/html/home.html');
});

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

const computerConfigRoutes = require('./routes/computerConfig.routes');
const authRoutes = require('./routes/auth.routes');
const gamesRoutes = require('./routes/games.routes');
// Đăng ký các router
app.use('/api/computer-config', computerConfigRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);

// Khởi tạo kết nối DB trước khi lắng nghe port
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server GameFit đang chạy tại: http://localhost:${PORT}`);
  });
});
