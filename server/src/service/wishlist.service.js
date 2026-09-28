const { sql } = require('../config/db');

const getWishlistGames = async (user_id) => {
    try {
        const request = new sql.Request();
        request.input('user_id', sql.Int, user_id);

        // Fetch games in user's wishlist using the provided SQL function
        const result = await request.query(`SELECT * FROM dbo.fn_GetGamesFromWishlist(@user_id)`);
        return { data: result.recordset };
    }
    catch (error) {
        console.log('Error in getWishlistGames Service: ', error.message);
        throw new Error('Lỗi khi lấy dữ liệu wishlist');
    }
}

const addWishlistGame = async (user_id, game_id) => {
    try {
        const request = new sql.Request();
        request.input('user_id', sql.Int, user_id);
        request.input('game_id', sql.Int, game_id);

        await request.execute('dbo.sp_AddGameToWishlist');
        return { data: true };
    }
    catch (error) {
        console.log('Error in addWishlistGame Service: ', error.message);
        throw new Error('Lỗi khi lưu game vào Wishlist');
    }
}

const deleteWishlistGame = async (user_id, game_id) => {
    try {
        const request = new sql.Request();
        request.input('user_id', sql.Int, user_id);
        request.input('game_id', sql.Int, game_id);

        await request.execute('dbo.sp_DeleteGameFromWishlist');
        return true;
    }
    catch (error) {
        console.log('Error in deleteWishlistGame Service: ', error.message);
        throw new Error('Lỗi khi xóa game khỏi Wishlist');
    }
}

module.exports = {
    getWishlistGames,
    addWishlistGame,
    deleteWishlistGame
};