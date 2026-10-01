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
    const games = gamesResult.recordset || [];

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

const getGameByTag = async (tag_id) => {
  try {
    const pool = await sql.connect();
    const request = pool.request();
    request.input("tag_id", sql.Int, tag_id);

    const result = await request.query(
      "SELECT * FROM dbo.fn_GetGamesByTag(@tag_id)",
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
    const request = pool.request();

    request.input("game_id", sql.Int, game.game_id);
    request.input("name", sql.VarChar(30), game.name);
    request.input("name_tag", sql.VarChar(sql.MAX), game.name_tag);
    request.input("developer", sql.VarChar(30), game.developer);
    request.input("is_active", sql.Bit, game.is_active);

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
    const request = pool.request();

    request.input("game_id", sql.Int, game_id);

    const result = await request.execute("sp_deleteGame");

    return {
      success: true,
      data: result.recordset || [],
    };
  } catch (error) {
    console.error("Lỗi khi xóa game:", error);
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
  // Thay đổi câu query này theo đúng tên bảng chứa Tags trong Database của bạn
  const query = `SELECT name FROM Tags`;

  const pool = await sql.connect();
  const result = await pool.request().query(query);
  return result.recordset.map(row => row.name); // trả về mảng chuỗi
};


const getAllPublishers = async () => {
  const query = `SELECT DISTINCT publisher FROM Games WHERE publisher IS NOT NULL AND publisher != ''`;
  const pool = await sql.connect();
  const result = await pool.request().query(query);
  return result.recordset.map(row => row.publisher);
};

<<<<<<< Updated upstream
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
  getAllCategories,
  getAllPublishers
};
=======
const getCompatibilityPercent = async (game_id, cpu_name, gpu_name, ram, storage, os) => {
    try {
        const pool = await sql.connect();
        const request = pool.request();
        request.input('game_id', sql.Int, parseInt(game_id));
        request.input('cpu_name', sql.VarChar(100), cpu_name || '');
        request.input('gpu_name', sql.VarChar(100), gpu_name || '');
        request.input('ram', sql.Int, parseInt(ram) || 0);
        request.input('storage', sql.Int, parseInt(storage) || 0);
        request.input('os', sql.VarChar(100), os || '');

        const result = await request.query(
            'SELECT dbo.fn_GetCompatibilityPercent(@game_id, @cpu_name, @gpu_name, @ram, @storage, @os) AS percent'
        );
        return result.recordset?.[0]?.percent;
    } catch (error) {
        console.error('Error in getCompatibilityPercent Service:', error.message);
        return null;
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
    deleteGame 
};


>>>>>>> Stashed changes
