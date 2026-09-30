const { sql } = require("../config/db");

const getCPUs = async (params = {}) => {
  try {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const search = params.search ? `%${params.search}%` : "%";

    const request = new sql.Request();
    request.input("search", search);
    request.input("offset", offset);
    request.input("limit", limit);

    const query = `
            SELECT * FROM CPUs 
            WHERE name LIKE @search OR brand LIKE @search
            ORDER BY cpu_id ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        `;
    const countQuery = `
            SELECT COUNT(*) AS totalItems FROM CPUs 
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
    console.error("Error in getCPUs Service:", error.message);
    throw new Error("Lỗi khi lấy danh sách CPU");
  }
};

const getCPUById = async (cpu_id) => {
  try {
    const request = new sql.Request();
    request.input("cpu_id", cpu_id);
    const result = await request.query(
      "SELECT * FROM CPUs WHERE cpu_id = @cpu_id",
    );
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error in getCPUById Service:", error.message);
    throw new Error("Lỗi khi lấy thông tin CPU");
  }
};

const addCPU = async ({ cpu_name, brand, benchmark_score }) => {
  try {
    const request = new sql.Request();
    request.input("cpu_name", cpu_name);
    request.input("brand", brand || null);
    request.input("benchmark_score", benchmark_score || 0);

    const result = await request.query(`
            INSERT INTO CPUs (cpu_name, brand, benchmark_score)
            OUTPUT INSERTED.*
            VALUES (@cpu_name, @brand, @benchmark_score);
        `);
    return result.recordset[0];
  } catch (error) {
    console.error("Error in addCPU Service:", error.message);
    throw new Error("Lỗi khi thêm CPU");
  }
};

const updateCPU = async (cpu_id, { cpu_name, brand, benchmark_score }) => {
  try {
    const request = new sql.Request();
    request.input("cpu_id", cpu_id);
    request.input("cpu_name", cpu_name);
    request.input("brand", brand || null);
    request.input("benchmark_score", benchmark_score || 0);

    const result = await request.query(`
            UPDATE CPUs
            SET cpu_name = COALESCE(@cpu_name, cpu_name),
                brand = COALESCE(@brand, brand),
                benchmark_score = COALESCE(@benchmark_score, benchmark_score)
            WHERE cpu_id = @cpu_id;
        `);
    return result.rowsAffected?.[0] > 0;
  } catch (error) {
    console.error("Error in updateCPU Service:", error.message);
    throw new Error("Lỗi khi cập nhật CPU");
  }
};

const deleteCPU = async (cpu_id) => {
  try {
    const request = new sql.Request();
    request.input("cpu_id", cpu_id);

    const result = await request.query(
      "DELETE FROM CPUs WHERE cpu_id = @cpu_id",
    );
    return result.rowsAffected?.[0] > 0;
  } catch (error) {
    console.error("Error in deleteCPU Service:", error.message);
    throw new Error("Lỗi khi xóa CPU");
  }
};

const searchCPUByName = async (cpu_name) => {
  try {
    const request = new sql.Request();
    request.input("cpu_name", `%${cpu_name}%`);

    const query = `
            SELECT cpu_id, name, brand, benchmark_score 
            FROM Cpus
            WHERE name LIKE @cpu_name
        `;
    const result = await request.query(query);
    return result.recordset;
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
