const tagsService = require("../service/tags.service");
const getTags = async (req, res) => {
  try {
    const tags = await tagsService.getTagsWithGameCount();
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
module.exports = { getTags };
