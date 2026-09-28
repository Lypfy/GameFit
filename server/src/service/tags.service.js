const { sql } = require("../config/db");
// gọi fn lấy tags và số lượng game từ db
const getTagsWithGameCount = async () => {
  try {
    const pool = await sql.connect();
    const result = await pool
      .request()
      .query("SELECT * FROM dbo.fn_GetTagsWithGameCount()");
    return result.recordset;
  } catch (error) {
    console.error(
      "Lỗi khi truy vấn dbo.fn_GetTagsWithGameCount():",
      error.message,
    );
    throw error;
  }
};
module.exports = {
  getTagsWithGameCount,
};
