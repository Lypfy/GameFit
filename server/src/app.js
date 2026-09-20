const express = require("express");
const cors = require("cors");
require("dotenv").config();

const routes = require("./routes");
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// API Routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "GameFit API is running smoothly." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Đã xảy ra lỗi trên máy chủ!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GameFit Server is running on http://localhost:${PORT}`);
});

module.exports = app;
