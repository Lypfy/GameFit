const wishlistService = require('../service/wishlist.service')

const getWishlistGames = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        const result = await wishlistService.getWishlistGames(user_id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Lấy dữ liệu game từ wishlist thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy dữ liệu game từ wishlist thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in getWishlistGames Controller: ', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin game trong wishlist' });
    }
}

const addWishlistGame = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { game_id } = req.body;
        const result = await wishlistService.addWishlistGame(user_id, game_id);

        if (!result) {
            return res.status(400).json({ success: false, message: 'Thêm game vào wishlist thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Thêm game vào wishlist thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in addWishlistGame Controller: ', error.message);
        return res.status(500).json({ succes: false, message: 'Lỗi server khi thêm game vào wishlist' });
    }
}

const deleteWishlistGame = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { game_id } = req.body;

        const result = await wishlistService.deleteWishlistGame(user_id, game_id);

        if (!result) {
            return res.status(400).json({ success: false, message: 'Xóa game khỏi wishlist thất bại' });
        }

        return res.satus(200).json({
            success: true,
            message: 'Xóa game khỏi wishlist thành công'
        })
    }
    catch (error) {
        console.log('Error in deleteWishlistGame Controller: ', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa game khỏi wishlist' });
    }
}

module.exports = {
    getWishlistGames,
    addWishlistGame,
    deleteWishlistGame
}