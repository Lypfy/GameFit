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

const getGameRequirement = async (req, res) => {
    try {
        const { game_id } = req.params;

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id không hợp lệ' });
        }

        const result = await gamesService.getGameRequirement(game_id);

        if (!result.success && result.message) {
            return res.status(404).json({ success: false, message: result.message });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin cấu hình game thành công',
            data: result.data
        });
    }
    catch (error) {
        console.log('Error in getGameRequirement Controller: ', error.message)
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin cấu hình game' });
    }
}

const checkGameCompatibility = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id, pc_id } = req.params;
        const { type } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu user_id hợp lệ'
            });
        }

        if (!game_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu game_id hợp lệ'
            });
        }

        if (!pc_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu pc_id hợp lệ'
            });
        }

        const result = await gamesService.checkGameCompatibility(
            user_id,
            pc_id,
            game_id,
            type || 'MINIMUM'
        );

        return res.status(200).json({
            success: true,
            message: 'Kiểm tra tương thích game thành công',
            data: result.data
        });
    }
    catch (error) {
        console.log(
            'Error in checkGameCompatibility Controller: ',
            error.message
        );

        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi kiểm tra tương thích game'
        });
    }
};

module.exports = {
    getGames,
    getGameDetail,
    getGameRequirement,
    checkGameCompatibility
}