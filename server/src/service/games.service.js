const sql = require('mssql'); // Đảm bảo bạn đã import thư viện

const getGames = async (page = 1, limit = 20) => {
    // 1. Tính toán số dòng cần OFFSET
    const offset = (page - 1) * limit;

    // 2. Viết câu query T-SQL gọi Function bạn vừa tạo
    const query = `SELECT * FROM dbo.fn_GetGames(@offset, @limit);`;

    // Câu query phụ để lấy tổng số game (để FE tính tổng số trang)
    const countQuery = `SELECT dbo.fn_TotalGames() AS totalItems;`;

    try {
        const pool = await sql.connect();
        const request = pool.request();

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const [gamesResult, countResult] = await Promise.all([
            request.query(query),
            pool.request().query(countQuery)
        ]);

        const totalItems = countResult.recordset[0].totalItems;

        const games = gamesResult.recordset;

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

const checkGameCompatibility = async (user_id, pc_id, game_id, type) => {
    try {
        const request = new sql.Request();

        request.input('user_id', sql.Int, user_id);
        request.input('pc_id', sql.Int, pc_id);
        request.input('game_id', sql.Int, game_id);
        request.input('type', sql.VarChar(20), type);

        const result = await request.execute('sp_CheckGameCompatibility');

        return {
            success: true,
            data: result.recordset
        };
    }
    catch (error) {
        console.log(
            'Error in checkGameCompatibility Service: ',
            error.message
        );

        throw new Error(error.message);
    }
}

const getGameByTag = async (tag_id) => {
    try {
        const pool = await sql.connect();
        const request = pool.request();
        request.input('tag_id', sql.Int, tag_id);

        const result = await request.query('SELECT * FROM dbo.fn_GetGamesByTag(@tag_id)');

        return {
            success: true,
            data: result.recordset
        };
    } catch (error) {
        console.error("Lỗi khi lấy game theo tag:", error);
        throw error;
    }
};

module.exports = { getGames, getGameDetail, getGameRequirement, checkGameCompatibility, getGameByTag };
