const cpusService = require("../service/cpus.service");

const getCPUs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const result = await cpusService.getCPUs({ page, limit, search });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách CPU thành công",
      data: result.data || result,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getCPUs Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy danh sách CPU" });
  }
};

const getCPUById = async (req, res) => {
  try {
    const cpu_id = req.params.id || req.query.cpu_id;

    if (!cpu_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu cpu_id hợp lệ" });
    }

    const result = await cpusService.getCPUById(cpu_id);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy CPU" });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin CPU thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error in getCPUById Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy thông tin CPU" });
  }
};

const addCPU = async (req, res) => {
  try {
    const { cpu_name, brand, benchmark_score } = req.body;

    if (!cpu_name) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu cpu_name hợp lệ" });
    }

    const result = await cpusService.addCPU({
      cpu_name,
      brand,
      benchmark_score,
    });

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Thêm CPU thất bại" });
    }

    return res.status(201).json({
      success: true,
      message: "Thêm CPU thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error in addCPU Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi thêm CPU" });
  }
};

const updateCPU = async (req, res) => {
  try {
    const cpu_id = req.params.id || req.body.cpu_id;
    const name = req.body.cpu_name || req.body.name;
    const { brand, benchmark_score } = req.body;

    if (!cpu_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu cpu_id hợp lệ" });
    }

    const result = await cpusService.updateCPU(cpu_id, {
      cpu_name: name,
      name,
      brand,
      benchmark_score,
    });

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Cập nhật CPU thất bại" });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật CPU thành công",
    });
  } catch (error) {
    console.error("Error in updateCPU Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server khi cập nhật CPU" });
  }
};

const deleteCPU = async (req, res) => {
  try {
    const cpu_id = req.params.id || req.body.cpu_id;

    if (!cpu_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu cpu_id hợp lệ" });
    }

    const result = await cpusService.deleteCPU(cpu_id);

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Xóa CPU thất bại" });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa CPU thành công",
    });
  } catch (error) {
    console.error("Error in deleteCPU Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server khi xóa CPU" });
  }
};

const searchCPUByName = async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp tên CPU" });
    }

    const result = await cpusService.searchCPUByName(name);

    return res.status(200).json({
      success: true,
      message: "Tìm kiếm CPU thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error in searchCPUByName Controller:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tìm kiếm CPU" });
  }
};

module.exports = {
  getCPUs,
  getCPUById,
  addCPU,
  updateCPU,
  deleteCPU,
  searchCPUByName,
};
