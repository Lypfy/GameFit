const { sql } = require('../config/db')

const addGame = async (user_id, game_id) => {
    try {
        const request = sql.Request();
        request.input('user_id', user_id);
        request.input('game_id', game_id);

        const result = await request.execute('sp_AddGameToWishlist');

        if (result.rowsAffected && result.rowsAffected[0] === 0) {
            return null;
        }

        return result.recordset?.[0];
    }
    catch (error) {
        console.log('Error in addGame Service: ', error.message);
        throw new Error('Lỗi khi lưu game vào Wishlist');
    }
}

const deleteGame = async (user_id, game_id) => {
    try {
        const request = sql.Request();
        request.input('user_id', user_id);
        request.input('game_id', game_id);

        const result = await request.execute('sp_DeleteGameFromWishlist');
        return result.rowsAffected?.[0] > 0;
    }
    catch (error) {
        console.log('Error in deleteGame Service: ', error.message);
        throw new Error('Lỗi khi xóa game khỏi Wishlist');
    }
}