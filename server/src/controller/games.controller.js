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

module.exports = {
    getGames
}