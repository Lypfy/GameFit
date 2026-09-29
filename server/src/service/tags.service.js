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
    const numericId = parseInt(id, 10);
    const validId = isNaN(numericId) ? id : numericId;

    try {
      const request = pool.request();
      request.input("tag_id", sql.Int, validId);
      request.input("name", sql.NVarChar(100), name);
      await request.execute("dbo.sp_UpdateTag");
      return true;
    } catch (spErr) {
      console.warn("Thử lại cập nhật tag với direct query:", spErr.message);
      const req2 = pool.request();
      req2.input("tag_id", sql.Int, validId);
      req2.input("name", sql.NVarChar(100), name);
      await req2.query("UPDATE Tags SET name = @name WHERE tag_id = @tag_id");
      return true;
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn updateTag:", error.message);
    throw error;
  }
};
const deleteTag = async (id) => {
  try {
    const pool = await sql.connect();
    const numericId = parseInt(id, 10);
    const validId = isNaN(numericId) ? id : numericId;

    try {
      const request = pool.request();
      request.input("tag_id", sql.Int, validId);
      await request.execute("dbo.sp_DeleteTag");
      return true;
    } catch (spErr) {
      console.warn("Thử lại xóa tag với direct query:", spErr.message);
      const req2 = pool.request();
      req2.input("tag_id", sql.Int, validId);
      await req2.query("DELETE FROM Tags WHERE tag_id = @tag_id");
      return true;
    }
  } catch (error) {
    console.error("Lỗi khi truy vấn deleteTag:", error.message);
    throw error;
  }
};
module.exports = {
  getTagsWithGameCount,
  addTag,
  updateTag,
  deleteTag,
};
