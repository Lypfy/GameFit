const { sql } = require("../config/db");

const getGpus = async (params = {}) => {
  try {
    if (!params) params = {};
    if (typeof params === "number" || typeof params === "string") {
      const gpu_id = parseInt(params, 10);
      const request = new sql.Request();
      request.input("gpu_id", sql.Int, gpu_id);
      const result = await request.execute("dbo.sp_GetGpuById");
      return result.recordset;
    }

    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, parseInt(params.limit, 10) || 20);
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : "";

    const request = new sql.Request();
    request.input("search", sql.NVarChar(100), search);
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);
    const result = await request.execute("dbo.sp_GetGpusPaging");
    const data = result.recordsets[0] || [];
    const totalItems = result.recordsets[1]?.[0]?.totalItems || 0;
    return {
      data: data,
      pagination: {
        currentPage: page,
        limit: limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  } catch (error) {
    console.error("Error in getGpus Service:", error.message);
    throw new Error("Lỗi khi lấy danh sách GPU");
  }
};

const addGpu = async (gpu_id, name, brand, benchmark_score) => {
  try {
    let gId = null;
    let gName = name;
    let gBrand = brand;
    let gScore = benchmark_score;

    if (typeof gpu_id === "object" && gpu_id !== null) {
      gName = gpu_id.gpu_name || gpu_id.name;
      gBrand = gpu_id.brand;
      gScore = gpu_id.benchmark_score;
      gId = gpu_id.gpu_id || null;
    } else if (typeof gpu_id === "string" && isNaN(gpu_id)) {
      gName = gpu_id;
      gBrand = name;
      gScore = brand;
      gId = null;
    } else if (gpu_id) {
      gId = parseInt(gpu_id, 10);
    }

    const request = new sql.Request();
    request.input("gpu_id", sql.Int, gId && gId > 0 ? gId : null);
    request.input("name", sql.NVarChar(100), gName);
    request.input("brand", sql.NVarChar(50), gBrand || null);
    request.input("benchmark_score", sql.Int, parseInt(gScore, 10) || 0);

    const result = await request.execute("dbo.sp_addGpus");

    if (
      result.rowsAffected &&
      result.rowsAffected[0] === 0 &&
      (!result.recordset || result.recordset.length === 0)
    ) {
      return null;
    }

    return result.recordset?.[0] || null;
  } catch (error) {
    console.error("Error in addGpu Service:", error.message);
    throw new Error("Lỗi khi thêm GPU");
  }
};

const updateGpu = async (gpu_id, data = {}, brandArg, scoreArg) => {
  try {
    let id = gpu_id;
    let gName =
      typeof data === "object" && data !== null
        ? data.gpu_name || data.name
        : data;
    let gBrand =
      typeof data === "object" && data !== null ? data.brand : brandArg;
    let gScore =
      typeof data === "object" && data !== null
        ? data.benchmark_score
        : scoreArg;

    if (typeof gpu_id === "object" && gpu_id !== null) {
      id = gpu_id.gpu_id || gpu_id.id;
      gName = gpu_id.gpu_name || gpu_id.name;
      gBrand = gpu_id.brand;
      gScore = gpu_id.benchmark_score;
    }

    const request = new sql.Request();
    request.input("gpu_id", sql.Int, parseInt(id, 10));
    request.input(
      "name",
      sql.NVarChar(100),
      typeof gName === "string" ? gName : null,
    );
    request.input(
      "brand",
      sql.NVarChar(50),
      typeof gBrand === "string" ? gBrand : null,
    );
    request.input(
      "benchmark_score",
      sql.Int,
      gScore !== undefined && gScore !== null && gScore !== ""
        ? parseInt(gScore, 10)
        : null,
    );

    const result = await request.execute("dbo.sp_updateGpus");
    return (
      (result.recordset && result.recordset.length > 0) ||
      (result.rowsAffected && result.rowsAffected[0] > 0)
    );
  } catch (error) {
    console.error("Error in updateGpu Service:", error.message);
    throw new Error("Lỗi khi cập nhật GPU: " + error.message);
  }
};

const deleteGpu = async (gpu_id) => {
  try {
    const request = new sql.Request();
    request.input("gpu_id", sql.Int, parseInt(gpu_id, 10));

    await request.execute("dbo.sp_deleteGpus");
    return true;
  } catch (error) {
    console.error("Error in deleteGpu Service:", error.message);
    throw new Error("Lỗi khi xóa GPU: " + error.message);
  }
};

const searchGpuByName = async (name) => {
  try {
    const request = new sql.Request();
    request.input("search", sql.NVarChar(100), name || "");
    const result = await request.execute("dbo.sp_SearchGpusByName");
    return result.recordset || [];
  } catch (error) {
    console.error("Error in searchGpuByName Service:", error.message);
    throw new Error("Lỗi khi tìm kiếm GPU theo tên");
  }
};

module.exports = {
  getGpus,
  getGPUById: getGpus,
  addGpu,
  addGPU: addGpu,
  updateGpu,
  updateGPU: updateGpu,
  deleteGpu,
  deleteGPU: deleteGpu,
  searchGpuByName,
};
