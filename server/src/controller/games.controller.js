const gamesService = require('../service/games.service')

const getGames = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await gamesService.getGames(page, limit);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Lấy thông tin game không thành công' })
        }
        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin game thành công',
            ...result
        });

    }
    catch (error) {
        console.log('Error in getGames Controller: ', error.message)
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin game' });
    }
}
const getGameDetail = async (req, res) => {
    try {
        const { game_id } = req.params; 
        
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id không hợp lệ' });
        }
        const result = await gamesService.getGameDetail(game_id);
        if (!result.success) {
            return res.status(404).json({
                success: false, 
                message: result.message || 'Lấy thông tin chi tiết game không thành công'
            }); 
        }
        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin chi tiết game thành công',
            data: result.data
        });
    } 
    catch (error) {
        console.log('Error in getGameDetail Controller: ', error.message)
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin chi tiết game' });
    }
}

module.exports = {
    getGames,
    getGameDetail
}