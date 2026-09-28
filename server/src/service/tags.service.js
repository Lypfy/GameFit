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
const addTag = async (name) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("name", sql.NVarChar, name);
    const result = await request.execute("dbo.sp_AddTag");
    return result.recordset[0];
  } catch (error) {
    console.error("Lỗi khi truy vấn dbo.sp_AddTag():", error.message);
    throw error;
  }
};
const updateTag = async (id, name) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("tag_id", sql.Int, id);
    request.input("name", sql.NVarChar, name);
    const result = await request.execute("dbo.sp_UpdateTag");
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Lỗi khi truy vấn dbo.sp_UpdateTag():", error.message);
    throw error;
  }
};
const deleteTag = async (id) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("tag_id", sql.Int, id);
    const result = await request.execute("dbo.sp_DeleteTag");
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Lỗi khi truy vấn dbo.sp_DeleteTag():", error.message);
    throw error;
  }
};
module.exports = {
  getTagsWithGameCount,
  addTag,
  updateTag,
  deleteTag,
};
