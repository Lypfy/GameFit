/**
 * Schema mẫu định nghĩa bảng Linh Kiện Phần Cứng (CPU / GPU)
 */
const HardwareSchema = {
  id: "String/UUID",
  type: "String (CPU | GPU)",
  brand: "String (Intel | AMD | Nvidia | Apple)",
  modelName: "String", // "Core i5-12400F", "GeForce RTX 3060"
  tier: "String (Entry | Mid-Range | High-End | Enthusiast)",
  benchmarkScore: "Number", // Điểm benchmark chuẩn hóa để so khớp cấu hình
  vramGb: "Number (for GPU only)",
  releaseYear: "Number",
  isActive: "Boolean"
};

module.exports = { HardwareSchema };
