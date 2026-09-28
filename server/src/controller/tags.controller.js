const tagsService = require("../service/tags.service");
const getTags = async (req, res) => {
  try {
    const search = req.query.search || "";
    const tags = await tagsService.getTagsWithGameCount(search);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách Tag thành công",
      data: tags,
    });
  } catch (error) {
    console.error("Lỗi getTags Controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách Tags",
    });
  }
};
// Thêm tags
const createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên tag",
      });
    }
    const newTag = await tagsService.addTag(name.trim());
    return res.status(201).json({
      success: true,
      message: "Thêm tag thành công",
      data: newTag,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi thêm tag",
    });
  }
};
// Sửa tags
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên tag",
      });
    }
    const success = await tagsService.updateTag(id, name.trim());
    if (success) {
      return res.status(200).json({
        success: true,
        message: "Cập nhật tag thành công",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Cập nhật tag thất bại",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật tag",
    });
  }
};
// Xoá mềm tag
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await tagsService.deleteTag(id);
    if (success) {
      return res.status(200).json({
        success: true,
        message: "Xoá tag thành công",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Xoá tag thất bại! Không tìm thấy tag!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xoá tag!",
    });
  }
};
module.exports = { getTags, createTag, updateTag, deleteTag };
