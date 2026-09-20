/**
 * Hardware Controller - Quản lý danh mục linh kiện CPU & GPU
 */

exports.getHardwareList = async (req, res) => {
  try {
    const { type } = req.query; // 'CPU' or 'GPU'
    // TODO: Lấy danh sách linh kiện từ DB
    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addHardware = async (req, res) => {
  try {
    const { type, brand, modelName, benchmarkScore } = req.body;
    // TODO: Thêm linh kiện mới (Dành cho Admin)
    res.status(201).json({
      success: true,
      message: "Thêm linh kiện mới thành công!",
      data: { type, brand, modelName, benchmarkScore },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
