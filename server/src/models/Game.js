/**
 * Schema mẫu định nghĩa bảng Tựa Game (Game)
 */
const GameSchema = {
  id: "String/UUID",
  title: "String",
  slug: "String (unique)",
  description: "String",
  genres: ["String"], // ['Action', 'RPG', 'FPS']
  releaseDate: "Date",
  developer: "String",
  publisher: "String",
  price: "Number",
  discountPercent: "Number",
  posterUrl: "String",
  bannerUrl: "String",
  rating: "Number", // 0.0 -> 5.0
  reviewCount: "Number",
  isActive: "Boolean",
  // Yêu cầu cấu hình hệ thống
  requirements: {
    minimum: {
      cpuScore: "Number (benchmark benchmark ranking)",
      cpuName: "String",
      gpuScore: "Number",
      gpuName: "String",
      ramGb: "Number",
      storageGb: "Number",
      os: "String"
    },
    recommended: {
      cpuScore: "Number",
      cpuName: "String",
      gpuScore: "Number",
      gpuName: "String",
      ramGb: "Number",
      storageGb: "Number",
      os: "String"
    }
  },
  createdAt: "Date",
  updatedAt: "Date"
};

module.exports = { GameSchema };
