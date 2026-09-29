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
        message: "Vui lòng nhập tên thể loại!",
      });
    }
    const newTag = await tagsService.addTag(name.trim());
    return res.status(201).json({
      success: true,
      message: "Thêm thể loại thành công!",
      data: newTag,
    });
  } catch (error) {
    console.error("Lỗi createTag Controller:", error.message);
    const isDuplicate =
      error.message &&
      (error.message.includes("UNIQUE") ||
        error.message.includes("duplicate") ||
        error.message.includes("PRIMARY KEY") ||
        error.message.includes("already exists"));

    return res.status(400).json({
      success: false,
      message: isDuplicate
        ? `Thể loại "${req.body.name}" đã tồn tại!`
        : `Lỗi khi thêm thể loại: ${error.message}`,
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
        message: "Vui lòng nhập tên thể loại!",
      });
    }
    const success = await tagsService.updateTag(id, name.trim());
    if (success) {
      return res.status(200).json({
        success: true,
        message: "Cập nhật thể loại thành công!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Cập nhật thể loại thất bại!",
      });
    }
  } catch (error) {
    console.error("Lỗi updateTag Controller:", error.message);
    const isDuplicate =
      error.message &&
      (error.message.includes("UNIQUE") ||
        error.message.includes("duplicate") ||
        error.message.includes("PRIMARY KEY") ||
        error.message.includes("already exists"));

    const isFK =
      error.message &&
      (error.message.includes("REFERENCE") ||
        error.message.includes("FOREIGN KEY") ||
        error.message.includes("FK_"));

    let msg = `Lỗi cập nhật: ${error.message}`;
    if (isDuplicate) {
      msg = `Thể loại "${req.body.name}" đã tồn tại trong hệ thống!`;
    } else if (isFK) {
      msg = `Không thể đổi tên vì bị ràng buộc dữ liệu liên quan!`;
    }

    return res.status(400).json({
      success: false,
      message: msg,
    });
  }
};

// Xoá tag
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await tagsService.deleteTag(id);
    if (success) {
      return res.status(200).json({
        success: true,
        message: "Xoá thể loại thành công!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Xoá thể loại thất bại!",
      });
    }
  } catch (error) {
    console.error("Lỗi deleteTag Controller:", error.message);
    const isFKError =
      error.message &&
      (error.message.includes("REFERENCE") ||
        error.message.includes("FOREIGN KEY") ||
        error.message.includes("FK_"));

    return res.status(400).json({
      success: false,
      message: isFKError
        ? "Không thể xóa thể loại này vì đang có các Game liên kết!"
        : `Lỗi khi xóa thể loại: ${error.message}`,
    });
  }
};

module.exports = { getTags, createTag, updateTag, deleteTag };
