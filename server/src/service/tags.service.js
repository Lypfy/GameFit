const { sql } = require("../config/db");
// gọi fn lấy tags và số lượng game từ db
const getTagsWithGameCount = async (search = "") => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("search", sql.NVarChar, search);
    const result = await request.query(
      "SELECT * FROM dbo.fn_SearchTagsWithGameCount(@search)",
    );
    return result.recordset;
  } catch (error) {
    console.error(
      "Lỗi khi truy vấn dbo.fn_SearchTagsWithGameCount():",
      error.message,
    );
    throw error;
  }
};
module.exports = {
  getTagsWithGameCount,
};
