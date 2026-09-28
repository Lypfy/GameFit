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

        // Trả về cấu trúc JSON đẹp cho Controller
        return {
            data: gamesResult.recordset,
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
        
        request.input('game_id', sql.Int, game_id);
        const checkQuery = 'SELECT dbo.fn_CheckGameExist(@game_id) AS IsExist';
        const checkResult = await request.query(checkQuery);
        
        if (!checkResult.recordset[0].IsExist) {
            return { success: false, message: 'Game không tồn tại trong hệ thống' };
        }

        const query = 'SELECT * FROM dbo.fn_GetGameDetail(@game_id)';
        const result = await request.query(query);

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
module.exports = { getGames, getGameDetail };
