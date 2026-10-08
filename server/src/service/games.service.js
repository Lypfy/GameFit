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

    // Bổ sung các thông tin chi tiết (developer, publisher, is_active) từ bảng Games
    if (games.length > 0) {
      try {
        const gameIds = games.map((g) => g.game_id || g.id).filter(Boolean);
        if (gameIds.length > 0) {
          const devReq = pool.request();
          const devRes = await devReq.query(`SELECT game_id, developer, publisher, is_active FROM Games WHERE game_id IN (${gameIds.join(",")})`);
          const devMap = new Map();
          (devRes.recordset || []).forEach((row) => {
            devMap.set(row.game_id, row);
          });
          games = games.map((g) => {
            const id = g.game_id || g.id;
            const extra = devMap.get(id);
            return {
              ...g,
              developer: extra?.developer || g.developer || "",
              publisher: extra?.publisher || g.publisher || "",
              is_active: extra?.is_active !== undefined ? extra.is_active : (g.is_active !== undefined ? g.is_active : 1),
            };
          });
        }
      } catch (enrichErr) {
        console.warn("Không thể bổ sung thông tin developer/publisher/is_active từ Games:", enrichErr.message);
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

    try {
      const request = pool.request();
      request.input("game_id", sql.Int, validId);
      request.input("name", sql.NVarChar(255), nameStr);
      request.input("name_tag", sql.NVarChar(sql.MAX), tagStr);
      request.input("developer", sql.NVarChar(255), devStr);
      request.input("is_active", sql.Bit, isActive);

      const result = await request.execute("sp_updateGame");

      if (game.image !== undefined) {
        try {
          const reqImg = pool.request();
          reqImg.input("game_id", sql.Int, validId);
          reqImg.input("image", sql.NVarChar(sql.MAX), game.image);
          await reqImg.query("UPDATE Games SET image = @image WHERE game_id = @game_id");
        } catch (imgErr) {
          console.warn("Lỗi khi cập nhật ảnh game:", imgErr.message);
        }
      }

      return {
        success: true,
        data: result.recordset || [],
      };
    } catch (spErr) {
      console.warn("Thử lại cập nhật game với direct query:", spErr.message);

      const reqUpdate = pool.request();
      reqUpdate.input("game_id", sql.Int, validId);
      reqUpdate.input("name", sql.NVarChar(255), nameStr);
      reqUpdate.input("developer", sql.NVarChar(255), devStr);
      reqUpdate.input("is_active", sql.Bit, isActive);

      await reqUpdate.query(`
        UPDATE Games 
        SET name = @name, developer = @developer, is_active = @is_active 
        WHERE game_id = @game_id
      `);

      if (game.image !== undefined) {
        try {
          const reqImg = pool.request();
          reqImg.input("game_id", sql.Int, validId);
          reqImg.input("image", sql.NVarChar(sql.MAX), game.image);
          await reqImg.query("UPDATE Games SET image = @image WHERE game_id = @game_id");
        } catch (imgErr) {
          console.warn("Lỗi khi cập nhật ảnh game (direct query):", imgErr.message);
        }
      }


      if (tagStr !== undefined && tagStr !== null) {
        try {
          const reqDelTags = pool.request();
          reqDelTags.input("game_id", sql.Int, validId);
          await reqDelTags.query(`DELETE FROM Games_Tags WHERE game_id = @game_id`);

          if (tagStr) {
            const reqInsTags = pool.request();
            reqInsTags.input("game_id", sql.Int, validId);
            reqInsTags.input("name_tag", sql.NVarChar(sql.MAX), tagStr);
            await reqInsTags.query(`
              INSERT INTO Games_Tags (game_id, tag_id)
              SELECT DISTINCT @game_id, t.tag_id
              FROM Tags t
              INNER JOIN STRING_SPLIT(@name_tag, ',') s
                ON LOWER(LTRIM(RTRIM(s.value))) = LOWER(LTRIM(RTRIM(t.name)))
            `);
          }
        } catch (tagErr) {
          console.warn("Lỗi khi cập nhật Games_Tags:", tagErr.message);
        }
      }

      return {
        success: true,
        data: [],
      };
    }
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

    try {
      const request = pool.request();
      request.input("game_id", sql.Int, validId);
      const result = await request.execute("sp_deleteGame");
      return {
        success: true,
        data: result.recordset || [],
      };
    } catch (spErr) {
      console.warn("Lỗi sp_deleteGame, thực hiện xóa trực tiếp (xóa ràng buộc FK):", spErr.message);

      // Xóa các bảng liên quan (FK) trước để tránh lỗi dính khóa ngoại
      const tablesToDeleteFrom = [
        "Wishlist",
        "Wishlists",
        "Games_Tags",
        "Game_Tags",
        "GameTags",
        "Game_requirement",
        "Game_Requirements",
        "GameRequirements",
        "Reviews",
        "Comments",
        "Ratings"
      ];

      for (const table of tablesToDeleteFrom) {
        try {
          const reqDel = pool.request();
          reqDel.input("game_id", sql.Int, validId);
          await reqDel.query(`DELETE FROM ${table} WHERE game_id = @game_id`);
        } catch (e) {
          // Bỏ qua nếu bảng không tồn tại hoặc không có khóa ngoại
        }
      }

      // Xóa game khỏi bảng Games
      const reqFinal = pool.request();
      reqFinal.input("game_id", sql.Int, validId);
      const finalResult = await reqFinal.query("DELETE FROM Games WHERE game_id = @game_id");

      return {
        success: true,
        data: finalResult.recordset || [],
      };
    }
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

    const tablesToTry = ["Game_requirement", "Game_Requirements", "GameRequirements"];

    for (const item of itemsToUpdate) {
      if (!item.data) continue;
      const { os, cpu_name, gpu_name, ram, storage } = item.data;

      // Thử gọi Stored Procedure sp_UpdateGameRequirement nếu đã cài trong CSDL SQL Server
      try {
        const spReq = pool.request();
        spReq.input("game_id", sql.Int, validId);
        spReq.input("type", sql.VarChar(50), item.type);
        spReq.input("os", sql.NVarChar(100), os ? os.trim() : "");
        spReq.input("cpu_name", sql.NVarChar(255), cpu_name ? cpu_name.trim() : "");
        spReq.input("gpu_name", sql.NVarChar(255), gpu_name ? gpu_name.trim() : "");
        spReq.input("ram", sql.Int, parseInt(ram, 10) || 0);
        spReq.input("storage", sql.Int, parseInt(storage, 10) || 0);

        const spRes = await spReq.execute("dbo.sp_UpdateGameRequirement");
        if (spRes.recordset?.[0] && spRes.recordset[0].success === 0) {
          console.warn("dbo.sp_UpdateGameRequirement thông báo:", spRes.recordset[0].message);
        } else {
          continue; // Đã chạy thành công qua Stored Procedure
        }
      } catch (spErr) {
        console.warn("Chạy sp_UpdateGameRequirement thất bại, chuyển sang query trực tiếp:", spErr.message);
      }

      // 1. Tìm cpu_id từ CPUs table dựa trên cpu_name nếu có
      let cpu_id = null;
      if (cpu_name && cpu_name.trim()) {
        try {
          const reqCpu = pool.request();
          reqCpu.input("searchCpu", sql.NVarChar(100), cpu_name.trim());
          const cpuRes = await reqCpu.query(`
            SELECT TOP 1 cpu_id FROM CPUs 
            WHERE LOWER(name) = LOWER(@searchCpu) 
               OR LOWER(cpu_name) = LOWER(@searchCpu) 
               OR name LIKE '%' + @searchCpu + '%' 
               OR cpu_name LIKE '%' + @searchCpu + '%'
          `);
          if (cpuRes.recordset?.[0]?.cpu_id) {
            cpu_id = cpuRes.recordset[0].cpu_id;
          }
        } catch (e) { }
      }

      // 2. Tìm gpu_id từ GPUs table dựa trên gpu_name nếu có
      let gpu_id = null;
      if (gpu_name && gpu_name.trim()) {
        try {
          const reqGpu = pool.request();
          reqGpu.input("searchGpu", sql.NVarChar(100), gpu_name.trim());
          const gpuRes = await reqGpu.query(`
            SELECT TOP 1 gpu_id FROM GPUs 
            WHERE LOWER(name) = LOWER(@searchGpu) 
               OR LOWER(gpu_name) = LOWER(@searchGpu) 
               OR name LIKE '%' + @searchGpu + '%' 
               OR gpu_name LIKE '%' + @searchGpu + '%'
          `);
          if (gpuRes.recordset?.[0]?.gpu_id) {
            gpu_id = gpuRes.recordset[0].gpu_id;
          }
        } catch (e) { }
      }

      const ramVal = parseInt(ram, 10) || 0;
      const storageVal = parseInt(storage, 10) || 0;
      const osVal = os ? os.trim() : "";

      for (const table of tablesToTry) {
        try {
          const checkReq = pool.request();
          checkReq.input("game_id", sql.Int, validId);
          checkReq.input("type", sql.VarChar(50), item.type);
          const existRes = await checkReq.query(`
            SELECT COUNT(*) AS cnt FROM ${table} 
            WHERE game_id = @game_id AND (UPPER(type) = UPPER(@type) OR type = @type)
          `);

          const exists = existRes.recordset?.[0]?.cnt > 0;

          if (exists) {
            const updReq = pool.request();
            updReq.input("game_id", sql.Int, validId);
            updReq.input("type", sql.VarChar(50), item.type);
            updReq.input("os", sql.NVarChar(100), osVal);
            updReq.input("ram", sql.Int, ramVal);
            updReq.input("storage", sql.Int, storageVal);
            if (cpu_id) updReq.input("cpu_id", sql.Int, cpu_id);
            if (gpu_id) updReq.input("gpu_id", sql.Int, gpu_id);

            let setFields = ["os = @os", "ram = @ram", "storage = @storage"];
            if (cpu_id) setFields.push("cpu_id = @cpu_id");
            if (gpu_id) setFields.push("gpu_id = @gpu_id");

            await updReq.query(`
              UPDATE ${table}
              SET ${setFields.join(", ")}
              WHERE game_id = @game_id AND (UPPER(type) = UPPER(@type) OR type = @type)
            `);

            // Check if cpu_name / gpu_name text columns exist and update them as well
            try {
              const textUpd = pool.request();
              textUpd.input("game_id", sql.Int, validId);
              textUpd.input("type", sql.VarChar(50), item.type);
              textUpd.input("cpu_name", sql.NVarChar(255), cpu_name ? cpu_name.trim() : "");
              textUpd.input("gpu_name", sql.NVarChar(255), gpu_name ? gpu_name.trim() : "");
              await textUpd.query(`
                UPDATE ${table}
                SET cpu_name = @cpu_name, gpu_name = @gpu_name
                WHERE game_id = @game_id AND (UPPER(type) = UPPER(@type) OR type = @type)
              `);
            } catch (tErr) { }

            break;
          } else {
            const insReq = pool.request();
            insReq.input("game_id", sql.Int, validId);
            insReq.input("type", sql.VarChar(50), item.type);
            insReq.input("os", sql.NVarChar(100), osVal);
            insReq.input("ram", sql.Int, ramVal);
            insReq.input("storage", sql.Int, storageVal);
            if (cpu_id) insReq.input("cpu_id", sql.Int, cpu_id);
            if (gpu_id) insReq.input("gpu_id", sql.Int, gpu_id);

            await insReq.query(`
              INSERT INTO ${table} (game_id, type, os, ram, storage ${cpu_id ? ', cpu_id' : ''} ${gpu_id ? ', gpu_id' : ''})
              VALUES (@game_id, @type, @os, @ram, @storage ${cpu_id ? ', @cpu_id' : ''} ${gpu_id ? ', @gpu_id' : ''})
            `);

            try {
              const textUpd = pool.request();
              textUpd.input("game_id", sql.Int, validId);
              textUpd.input("type", sql.VarChar(50), item.type);
              textUpd.input("cpu_name", sql.NVarChar(255), cpu_name ? cpu_name.trim() : "");
              textUpd.input("gpu_name", sql.NVarChar(255), gpu_name ? gpu_name.trim() : "");
              await textUpd.query(`
                UPDATE ${table}
                SET cpu_name = @cpu_name, gpu_name = @gpu_name
                WHERE game_id = @game_id AND (UPPER(type) = UPPER(@type) OR type = @type)
              `);
            } catch (tErr) { }

            break;
          }
        } catch (tblErr) {
          // Thử tên bảng kế tiếp
        }
      }
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

