const { sql } = require("../config/db");

const getCPUs = async (params = {}) => {
  try {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, parseInt(params.limit, 10) || 20);
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : "";

    const request = new sql.Request();
    request.input("search", sql.NVarChar(100), search);
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);

    const result = await request.execute("dbo.sp_GetCpusPaging");
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
    console.error("Error in getCPUs Service:", error.message);
    throw new Error("Lỗi khi lấy danh sách CPU");
  }
};

const getCPUById = async (cpu_id) => {
  try {
    const request = new sql.Request();
    request.input("cpu_id", sql.Int, parseInt(cpu_id, 10));
    const result = await request.execute("dbo.sp_GetCpuById");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error in getCPUById Service:", error.message);
    throw new Error("Lỗi khi lấy thông tin CPU");
  }
};

const addCPU = async ({ cpu_name, brand, benchmark_score }) => {
  try {
    const request = new sql.Request();
    request.input("cpu_id", sql.Int, null);
    request.input("name", sql.NVarChar(100), cpu_name);
    request.input("brand", sql.NVarChar(50), brand || null);
    request.input(
      "benchmark_score",
      sql.Int,
      parseInt(benchmark_score, 10) || 0,
    );

    const result = await request.execute("dbo.sp_addCpus");
    return result.recordset?.[0] || null;
  } catch (error) {
    console.error("Error in addCPU Service:", error.message);
    throw new Error("Lỗi khi thêm CPU");
  }
};

const updateCPU = async (cpu_id, data = {}, brandArg, scoreArg) => {
  try {
    let id = cpu_id;
    let cpu_name =
      typeof data === "object" && data !== null
        ? data.cpu_name || data.name
        : data;
    let brand =
      typeof data === "object" && data !== null ? data.brand : brandArg;
    let benchmark_score =
      typeof data === "object" && data !== null
        ? data.benchmark_score
        : scoreArg;

    if (typeof cpu_id === "object" && cpu_id !== null) {
      id = cpu_id.cpu_id || cpu_id.id;
      cpu_name = cpu_id.cpu_name || cpu_id.name;
      brand = cpu_id.brand;
      benchmark_score = cpu_id.benchmark_score;
    }

    const request = new sql.Request();
    request.input("cpu_id", sql.Int, parseInt(id, 10));
    request.input(
      "name",
      sql.NVarChar(100),
      typeof cpu_name === "string" ? cpu_name : null,
    );
    request.input(
      "brand",
      sql.NVarChar(50),
      typeof brand === "string" ? brand : null,
    );
    request.input(
      "benchmark_score",
      sql.Int,
      benchmark_score !== undefined &&
        benchmark_score !== null &&
        benchmark_score !== ""
        ? parseInt(benchmark_score, 10)
        : null,
    );

    const result = await request.execute("dbo.sp_updateCpus");
    return (
      (result.recordset && result.recordset.length > 0) ||
      (result.rowsAffected && result.rowsAffected[0] > 0)
    );
  } catch (error) {
    console.error("Error in updateCPU Service:", error.message);
    throw new Error("Lỗi khi cập nhật CPU: " + error.message);
  }
};

const deleteCPU = async (cpu_id) => {
  try {
    const request = new sql.Request();
    request.input("cpu_id", sql.Int, parseInt(cpu_id, 10));
    await request.execute("dbo.sp_deleteCpus");
    return true;
  } catch (error) {
    console.error("Error in deleteCPU Service:", error.message);
    throw new Error("Lỗi khi xóa CPU: " + error.message);
  }
};

const searchCPUByName = async (cpu_name) => {
  try {
    const searchVal = cpu_name ? cpu_name.trim() : "";
    const request = new sql.Request();
    request.input("search", sql.NVarChar(100), searchVal);
    try {
      const result = await request.execute("dbo.sp_SearchCpusByName");
      if (result.recordset && result.recordset.length > 0) {
        return result.recordset;
      }
    } catch (spErr) {
      console.warn("sp_SearchCpusByName SP failed, trying direct query:", spErr.message);
    }

    const req2 = new sql.Request();
    req2.input("search", sql.NVarChar(100), `%${searchVal}%`);
    const res2 = await req2.query(
      "SELECT TOP 50 cpu_id, name, brand, benchmark_score FROM CPUs WHERE name LIKE @search OR brand LIKE @search OR @search = '%%' ORDER BY benchmark_score DESC, cpu_id ASC"
    );
    return res2.recordset || [];
  } catch (error) {
    console.error("Error in searchCPUByName Service:", error.message);
    throw new Error("Lỗi khi tìm kiếm CPU theo tên");
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
