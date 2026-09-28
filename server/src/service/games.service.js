const sql = require('mssql'); // Đảm bảo bạn đã import thư viện

const getGames = async (page = 1, limit = 20) => {
    // 1. Tính toán số dòng cần OFFSET
    const offset = (page - 1) * limit;

    // 2. Viết câu query T-SQL gọi Function bạn vừa tạo
    const query = `SELECT * FROM dbo.fn_GetGames(@offset, @limit);`;

    // Câu query phụ để lấy tổng số game (để FE tính tổng số trang)
    const countQuery = `SELECT dbo.fn_TotalGames() AS totalItems;`;

    try {
        // 3. Thực thi query
        const pool = await sql.connect(); // Đảm bảo bạn gọi connection pool của bạn ở đây
        const request = pool.request();

        // Truyền tham số an toàn
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        // Chạy song song 2 query để tối ưu thời gian (Lấy data và đếm tổng)
        const [gamesResult, countResult] = await Promise.all([
            request.query(query),
            pool.request().query(countQuery)
        ]);

        const totalItems = countResult.recordset[0].totalItems;

        const games = gamesResult.recordset;
        
        // Lấy điểm trung bình cho từng game
        for (let game of games) {
            const gameId = game.game_id || game.id;
            if (gameId) {
                const r = pool.request();
                r.input('game_id', sql.Int, gameId);
                try {
                    const ratingRes = await r.query('SELECT dbo.fn_GetAverageRating(@game_id) AS avgRating');
                    const avg = ratingRes.recordset[0].avgRating;
                    game.rating = avg !== null ? Number(avg) : 0;
                } catch (e) {
                    game.rating = 0;
                }
            } else {
                game.rating = 0;
            }
        }

        // Trả về cấu trúc JSON đẹp cho Controller
        return {
            data: games,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        };
    } catch (error) {
        console.error("Lỗi khi lấy danh sách games:", error);
        throw error;
    }
};

const getGameDetail = async (game_id) => {
    try {
        const request = new sql.Request();
        request.input('game_id', game_id);
        const checkGame = await request.query('SELECT dbo.fn_CheckGameExist(@game_id) AS IsExist');
        if (!checkGame.recordset[0].IsExist) {
            return { success: false, message: 'Game không tồn tại trong hệ thống' };
        }

        const query = 'SELECT * FROM fn_GetGameDetail(@game_id)'
        const result = await request.query(query)

        return {
            success: true,
            data: result.recordset
        };
    }
    catch (error) {
        console.log('Error in getGameDetail Service: ', error.message)
        throw new Error('Lỗi khi lấy thông tin chi tiết game');
    }
}

const getGameRequirement = async (game_id) => {
    try {
        const request = new sql.Request();
        request.input('game_id', game_id);

        const checkGame = await request.query('SELECT dbo.fn_CheckGameExist(@game_id) AS IsExist');
        if (!checkGame.recordset[0].IsExist) {
            return { success: false, message: 'Cấu hình game không tồn tại trong hệ thống' };
        }

        const result = await request.query('SELECT * FROM dbo.fn_GetGameRequirementByID(@game_id)');
        return {
            success: true,
            data: result.recordset
        };
    }
    catch (error) {
        console.log('Error in getGameRequirement Service: ', error.message)
        throw new Error('Lỗi khi lấy thông tin cấu hình game');
    }
}
module.exports = { getGames, getGameDetail, getGameRequirement };
