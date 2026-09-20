/**
 * Cấu hình kết nối Cơ sở dữ liệu (MongoDB / PostgreSQL / MySQL)
 */
const connectDB = async () => {
  try {
    const dbUri = process.env.DB_URI || "mongodb://localhost:27017/gamefit";
    // TODO: Thay thế bằng kết nối ORM thực tế khi chọn Database (mongoose.connect / Sequelize / Prisma)
    console.log(`[DB] Đang chuẩn bị kết nối CSDL tại: ${dbUri}`);
  } catch (error) {
    console.error("[DB Error] Kết nối cơ sở dữ liệu thất bại:", error.message);
  }
};

module.exports = { connectDB };
