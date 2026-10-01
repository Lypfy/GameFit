const express = require("express");
require("dotenv").config();
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

const path = require("path");

app.use(express.json());

// Phục vụ các file tĩnh (Frontend: HTML, CSS, JS) từ thư mục client
app.use(express.static(path.join(__dirname, "../../client")));

// Tự động chuyển hướng khi người dùng gõ localhost:5000
app.get("/", (req, res) => {
  res.redirect("/html/home.html");
});

const computerConfigRoutes = require("./routes/computerConfig.routes");
const authRoutes = require("./routes/auth.routes");
const gamesRoutes = require("./routes/games.routes");
const cpusRoutes = require("./routes/cpus.routes");
const gpusRoutes = require("./routes/gpus.routes");
const tagsRoutes = require("./routes/tags.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const reviewRoutes = require("./routes/review.routes");
const statisticsRoutes = require("./routes/statistics.routes");

// Đăng ký các router
app.use("/api/computer-config", computerConfigRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/cpus", cpusRoutes);
app.use("/api/gpus", gpusRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/statistics", statisticsRoutes);

// Khởi tạo kết nối DB trước khi lắng nghe port
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server GameFit đang chạy tại: http://localhost:${PORT}`);
  });
});
