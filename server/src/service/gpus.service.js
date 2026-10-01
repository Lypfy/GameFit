const { sql } = require("../config/db");

const getGpus = async (params = {}) => {
  try {
    if (!params) params = {};
    if (typeof params === "number" || typeof params === "string") {
      const gpu_id = params;
      const request = new sql.Request();
      request.input("gpu_id", gpu_id);
      const result = await request.query(
        "SELECT gpu_id, name, name AS gpu_name, brand, benchmark_score FROM GPUs WHERE gpu_id = @gpu_id",
      );
      return result.recordset;
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const search = params.search ? `%${params.search}%` : "%";

    const request = new sql.Request();
    request.input("search", search);
    request.input("offset", offset);
    request.input("limit", limit);

    const query = `
      SELECT gpu_id, name, name AS gpu_name, brand, benchmark_score FROM GPUs 
      WHERE name LIKE @search OR brand LIKE @search
      ORDER BY gpu_id ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
    const countQuery = `
      SELECT COUNT(*) AS totalItems FROM GPUs 
      WHERE name LIKE @search OR brand LIKE @search;
    `;

    const result = await request.query(query);
    const countResult = await new sql.Request()
      .input("search", search)
      .query(countQuery);
    const totalItems = countResult.recordset[0]?.totalItems || 0;

    return {
      data: result.recordset,
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
    const request = new sql.Request();
    request.input("gpu_id", gpu_id);
    request.input("name", name);
    request.input("brand", brand);
    request.input("benchmark_score", benchmark_score);

    const result = await request.execute("sp_addGpu");

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return null;
    }

    return result.recordset?.[0];
  } catch (error) {
    console.error("Error in addGpu Service:", error.message);
    throw new Error("Lỗi khi thêm gpu");
  }
};

const updateGpu = async (gpu_id, name, brand, benchmark_score) => {
  try {
    const request = new sql.Request();
    request.input("gpu_id", gpu_id);
    request.input("name", name);
    request.input("brand", brand);
    request.input("benchmark_score", benchmark_score);

    const result = await request.execute("sp_updateGpu");
    return result.rowsAffected?.[0] > 0;
  } catch (error) {
    console.log("Error in updateGpu Service", error.message);
    throw new Error("Lỗi khi cập nhật gpu");
  }
};

const deleteGpu = async (gpu_id) => {
  try {
    const request = new sql.Request();
    request.input("gpu_id", gpu_id);

    const result = await request.execute("sp_deleteGpu");
    return result.rowsAffected?.[0] > 0;
  } catch (error) {
    console.log("Error in deleteGpu", error.message);
    throw new Error("Lỗi khi xóa gpu");
  }
};

const searchGpuByName = async (name) => {
  try {
    const request = new sql.Request();
    request.input("name", `%${name}%`);

    const query = `
            SELECT gpu_id, name, brand, benchmark_score
            FROM Gpus
            WHERE name LIKE @name
        `;
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error in searchGpuByName Service:", error.message);
    throw new Error("Lỗi khi tìm kiếm GPU theo tên");
  }
};

module.exports = {
  getGpus,
  addGpu,
  updateGpu,
  deleteGpu,
  searchGpuByName,
};
