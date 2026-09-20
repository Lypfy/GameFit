const { evaluateCompatibility } = require("../services/compatibility.service");

/**
 * Game Controller - Quản lý danh sách game, chi tiết và kiểm tra độ tương thích
 */

exports.getAllGames = async (req, res) => {
  try {
    const { genre, search, page = 1, limit = 20 } = req.query;
    // TODO: Truy vấn từ DB với phân trang và bộ lọc
    res.status(200).json({
      success: true,
      total: 0,
      page: Number(page),
      data: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Tìm game theo ID
    res.status(200).json({
      success: true,
      data: { id, title: "Mock Game", requirements: {} },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkGameCompatibility = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { cpuScore, gpuScore, ramGb, storageGb } = req.body;

    // Mock game requirements
    const mockGameReq = {
      minimum: { cpuScore: 5000, gpuScore: 6000, ramGb: 8, storageGb: 50 },
      recommended: { cpuScore: 8000, gpuScore: 10000, ramGb: 16, storageGb: 50 },
    };

    const userPc = { cpuScore: Number(cpuScore), gpuScore: Number(gpuScore), ramGb: Number(ramGb), storageGb: Number(storageGb) };
    const result = evaluateCompatibility(userPc, mockGameReq);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
