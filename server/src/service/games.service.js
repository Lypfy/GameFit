const { sql } = require("../config/db");

const getGames = async (page = 1, limit = 20, filters = {}) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.max(1, parseInt(limit) || 20);
  const offset = (validPage - 1) * validLimit;

  // Gọi SQL Function với 3 tham số lọc
  const query = `SELECT * FROM dbo.fn_GetGames(@offset, @limit, @categories, @publishers, @rams);`;
  const countQuery = `SELECT dbo.fn_TotalGames(@categories, @publishers, @rams) AS totalItems;`;

  try {
    const pool = await sql.connect();

    // Khởi tạo các biến lọc, gán null nếu client không truyền
    const categories = filters.categories || null;
    const publishers = filters.publishers || null;
    const rams = filters.rams || null;

    const reqGames = pool.request();
    reqGames.input("offset", sql.Int, offset);
    reqGames.input("limit", sql.Int, validLimit);
    reqGames.input("categories", sql.NVarChar(sql.MAX), categories);
    reqGames.input("publishers", sql.NVarChar(sql.MAX), publishers);
    reqGames.input("rams", sql.NVarChar(sql.MAX), rams);

    const reqCount = pool.request();
    reqCount.input("categories", sql.NVarChar(sql.MAX), categories);
    reqCount.input("publishers", sql.NVarChar(sql.MAX), publishers);
    reqCount.input("rams", sql.NVarChar(sql.MAX), rams);

    const [gamesResult, countResult] = await Promise.all([
      reqGames.query(query),
      reqCount.query(countQuery),
    ]);

    // Lấy ra danh sách game và tổng số game
    const totalItems = countResult.recordset?.[0]?.totalItems || 0;
    let games = gamesResult.recordset || [];

    const sort = filters.sort;
    if (sort === "name-asc" || sort === "name") {
      if (!categories && !publishers && !rams) {
        try {
          const spReq = pool.request();
          const spRes = await spReq.execute("sp_sortByname");
          if (spRes.recordset && spRes.recordset.length > 0) {
            games = spRes.recordset.slice(offset, offset + validLimit);
          } else {
            games.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" }));
          }
        } catch (spErr) {
          games.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" }));
        }
      } else {
        games.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" }));
      }
    } else if (sort === "rating-desc" || sort === "rating") {
      if (!categories && !publishers && !rams) {
        try {
          const spReq = pool.request();
          const spRes = await spReq.execute("sp_sortByRating");
          if (spRes.recordset && spRes.recordset.length > 0) {
            games = spRes.recordset.map((row) => ({
              ...row,
              rating: row.DiemTrungBinh !== undefined ? row.DiemTrungBinh : row.rating,
            })).slice(offset, offset + validLimit);
          } else {
            games.sort((a, b) => (parseFloat(b.rating || b.DiemTrungBinh) || 0) - (parseFloat(a.rating || a.DiemTrungBinh) || 0));
          }
        } catch (spErr) {
          games.sort((a, b) => (parseFloat(b.rating || b.DiemTrungBinh) || 0) - (parseFloat(a.rating || a.DiemTrungBinh) || 0));
        }
      } else {
        games.sort((a, b) => (parseFloat(b.rating || b.DiemTrungBinh) || 0) - (parseFloat(a.rating || a.DiemTrungBinh) || 0));
      }
    }
    return {
      data: games,
      pagination: {
        currentPage: validPage,
        limit: validLimit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / validLimit) || 1,
      },
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách games:", error);
    throw error;
  }
};

const getFullGameDetail = async (game_id) => {
  try {
    const pool = await sql.connect();

    const reqInfo = pool.request();
    reqInfo.input("game_id", sql.Int, game_id);

    const reqRequirements = pool.request();
    reqRequirements.input("game_id", sql.Int, game_id);

    const [gameInfoResult, reqInfoResult] = await Promise.all([
      reqInfo.query("SELECT * FROM fn_GetGameDetail(@game_id)"),
      reqRequirements.query(
        "SELECT * FROM fn_GetGameRequirementByID(@game_id)",
      ),
    ]);

    const gameInfo = gameInfoResult.recordset?.[0];
    if (!gameInfo) {
      return {
        success: false,
        message: "Không tìm thấy thông tin chi tiết game",
      };
    }

    return {
      success: true,
      data: {
        info: gameInfo,
        requirements: reqInfoResult.recordset || [],
      },
    };
  } catch (error) {
    console.error("Error in getFullGameDetail:", error);
    throw new Error("Lỗi khi lấy thông tin chi tiết game đầy đủ");
  }
};

const getGameRequirement = async (game_id) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("game_id", sql.Int, game_id);

    const result = await request.query(
      "SELECT * FROM dbo.fn_GetGameRequirementByID(@game_id)",
    );
    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.log("Error in getGameRequirement Service: ", error.message);
    throw new Error("Lỗi khi lấy thông tin cấu hình game");
  }
};

const checkGameCompatibility = async (user_id, pc_id, game_id, type) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();

    request.input("user_id", sql.Int, user_id);
    request.input("pc_id", sql.Int, pc_id);
    request.input("game_id", sql.Int, game_id);
    request.input("type", sql.VarChar(20), type);

    const result = await request.execute("sp_CheckGameCompatibility");

    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.log("Error in checkGameCompatibility Service: ", error.message);
    throw new Error(error.message);
  }
};

const getGameByTag = async (tag_name) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("tag_name", sql.NVarChar(50), tag_name);

    const result = await request.query(
      "SELECT * FROM dbo.fn_GetGamesByTag(@tag_name)",
    );

    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi lấy game theo tag:", error);
    throw error;
  }
};

const addGame = async (game) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();

    request.input("name", sql.NVarChar(255), game.name);
    request.input("description", sql.NVarChar(sql.MAX), game.description || "");
    request.input("publisher", sql.NVarChar(255), game.publisher || "");
    request.input("developer", sql.NVarChar(255), game.developer || "");
    request.input("name_tag", sql.NVarChar(sql.MAX), game.name_tag || "");
    request.input(
      "release_date",
      sql.DateTime,
      game.release_date ? new Date(game.release_date) : new Date(),
    );
    request.input("download_url", sql.VarChar(500), game.download_url || "");
    request.input("image", sql.NVarChar(sql.MAX), game.image || "");

    const result = await request.execute("sp_addGame");

    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi thêm game:", error);
    throw error;
  }
};

const updateGame = async (game) => {
  try {
    const pool = await sql.connect();
    const validId = parseInt(game.game_id, 10);
    const isActive = game.is_active ? 1 : 0;
    const nameStr = game.name ? game.name.trim() : "";
    const devStr = game.developer ? game.developer.trim() : "";
    const tagStr = game.name_tag ? game.name_tag.trim() : "";

    const request = pool.request();
    request.input("game_id", sql.Int, validId);
    request.input("name", sql.NVarChar(255), nameStr);
    request.input("name_tag", sql.NVarChar(sql.MAX), tagStr);
    request.input("developer", sql.NVarChar(255), devStr);
    request.input("is_active", sql.Bit, isActive);
    const result = await request.execute("sp_updateGame");

    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật game:", error);
    throw error;
  }
};


const deleteGame = async (game_id) => {
  try {
    const pool = await sql.connect();
    const numericId = parseInt(game_id, 10);
    const validId = isNaN(numericId) ? game_id : numericId;

    const request = pool.request();
    request.input("game_id", sql.Int, validId);
    const result = await request.execute("sp_deleteGame");

    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi xóa game:", error.message || error);
    throw error;
  }
};

const getCompatibilityPercent = async (
  game_id,
  cpu_name,
  gpu_name,
  ram,
  storage,
  os,
) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("game_id", sql.Int, parseInt(game_id));
    request.input("cpu_name", sql.VarChar(100), cpu_name || "");
    request.input("gpu_name", sql.VarChar(100), gpu_name || "");
    request.input("ram", sql.Int, parseInt(ram) || 0);
    request.input("storage", sql.Int, parseInt(storage) || 0);
    request.input("os", sql.VarChar(100), os || "");

    const result = await request.query(
      "SELECT dbo.fn_GetCompatibilityPercent(@game_id, @cpu_name, @gpu_name, @ram, @storage, @os) AS [percent]",
    );
    return result.recordset?.[0]?.percent;
  } catch (error) {
    console.error("Error in getCompatibilityPercent Service:", error.message);
    return null;
  }
};

const getAllCategories = async () => {
  const pool = await sql.connect();
  const result = await pool.request().query("SELECT name FROM dbo.fn_SearchTagsWithGameCount('')");
  return result.recordset.map(row => row.name);
};

const getAllPublishers = async () => {
  const pool = await sql.connect();
  const result = await pool.request().query("SELECT publisher FROM dbo.fn_GetAllPublishers()");
  return result.recordset.map(row => row.publisher);
};


const sortGamesByName = async () => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().execute("sp_sortByname");
    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi sắp xếp game theo tên (sp_sortByname):", error);
    throw error;
  }
};

const sortGamesByRating = async () => {
  try {
    const pool = await sql.connect();
    const result = await pool.request().execute("sp_sortByRating");
    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi sắp xếp game theo đánh giá (sp_sortByRating):", error);
    throw error;
  }
};

const updateGameRequirement = async (game_id, minimum, recommended) => {
  try {
    const pool = await sql.connect();
    const validId = parseInt(game_id, 10);
    if (isNaN(validId) || !validId) {
      throw new Error("Mã game không hợp lệ");
    }

    const itemsToUpdate = [
      { type: "MINIMUM", data: minimum },
      { type: "RECOMMENDED", data: recommended }
    ];

    for (const item of itemsToUpdate) {
      if (!item.data) continue;
      const { os, cpu_name, gpu_name, ram, storage } = item.data;

      const spReq = pool.request();
      spReq.input("game_id", sql.Int, validId);
      spReq.input("type", sql.VarChar(50), item.type);
      spReq.input("os", sql.NVarChar(100), os ? os.trim() : "");
      spReq.input("cpu_name", sql.NVarChar(255), cpu_name ? cpu_name.trim() : "");
      spReq.input("gpu_name", sql.NVarChar(255), gpu_name ? gpu_name.trim() : "");
      spReq.input("ram", sql.Int, parseInt(ram, 10) || 0);
      spReq.input("storage", sql.Int, parseInt(storage, 10) || 0);

      await spReq.execute("dbo.sp_UpdateGameRequirement");
    }

    return {
      success: true,
      message: "Cập nhật thông tin cấu hình game thành công"
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật cấu hình game:", error);
    throw error;
  }
};


module.exports = {
  getGames,
  getFullGameDetail,
  getGameRequirement,
  checkGameCompatibility,
  getCompatibilityPercent,
  getGameByTag,
  addGame,
  updateGame,
  deleteGame,
  updateGameRequirement,
  getAllCategories,
  getAllPublishers,
  sortGamesByName,
  sortGamesByRating
};

