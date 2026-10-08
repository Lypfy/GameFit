const gamesService = require('../service/games.service');

const getGames = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 20);

        // Đọc filter và sort từ query parameters mà frontend gửi lên
        const filters = {
            categories: req.query.categories || null,
            publishers: req.query.publishers || null,
            rams: req.query.rams || null,
            sort: req.query.sort || req.query.sortBy || null,
        };

        const result = await gamesService.getGames(page, limit, filters);
        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin game thành công',
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.log('Error in getGames Controller: ', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin game' });
    }
};


const getFullGameDetail = async (req, res) => {
    try {
        const { game_id } = req.params;

        if (!game_id || isNaN(game_id)) {
            return res.status(400).json({ success: false, message: 'Thiếu hoặc game_id không hợp lệ' });
        }
        const result = await gamesService.getFullGameDetail(game_id);
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
    } catch (error) {
        console.log('Error in getGameDetail Controller: ', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin chi tiết game' });
    }
};

const getGameRequirement = async (req, res) => {
    try {
        const { game_id } = req.params;

        if (!game_id || isNaN(game_id)) {
            return res.status(400).json({ success: false, message: 'Thiếu hoặc game_id không hợp lệ' });
        }

        const result = await gamesService.getGameRequirement(game_id);

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin cấu hình game thành công',
            data: result.data
        });
    } catch (error) {
        console.log('Error in getGameRequirement Controller: ', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin cấu hình game' });
    }
};

const checkGameCompatibility = async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const { game_id } = req.params;
        const { pc_id, type } = req.query;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: 'Thiếu user_id hợp lệ hoặc chưa đăng nhập'
            });
        }

        if (!game_id || isNaN(game_id)) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu hoặc game_id không hợp lệ'
            });
        }

        if (!pc_id || isNaN(pc_id)) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu hoặc pc_id không hợp lệ'
            });
        }

        const result = await gamesService.checkGameCompatibility(user_id, pc_id, game_id, type || 'MINIMUM');

        return res.status(200).json({
            success: true,
            message: 'Kiểm tra tương thích game thành công',
            data: result.data
        });
    } catch (error) {
        console.log('Error in checkGameCompatibility Controller: ', error.message);
        return res.status(500).json({ success: false, message: error.message || 'Lỗi server khi kiểm tra tương thích game' });
    }
};

const getGameByTag = async (req, res) => {
    try {
        const { tag_id } = req.params;

        if (!tag_id || isNaN(tag_id)) {
            return res.status(400).json({ success: false, message: 'Thiếu hoặc tag_id không hợp lệ' });
        }

        const result = await gamesService.getGameByTag(tag_id);

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách game theo tag thành công',
            data: result.data
        });
    } catch (error) {
        console.log('Error in getGameByTag Controller: ', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin game theo tag' });
    }
};

const updateGame = async (req, res) => {
    try {
        const {
            game_id,
            name,
            name_tag,
            developer,
            is_active,
            image
        } = req.body;

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên game' });
        }

        const game = {
            game_id: parseInt(game_id, 10),
            name: name.trim(),
            name_tag: name_tag ? name_tag.trim() : '',
            developer: developer ? developer.trim() : '',
            is_active: is_active ? 1 : 0,
            image: image ? (Array.isArray(image) ? image.join(' ') : image.trim()) : undefined
        };

        const result = await gamesService.updateGame(game);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật game thành công',
            data: result.data
        });
    } catch (error) {
        console.log('Error in updateGame Controller:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật game'
        });
    }
};

const deleteGame = async (req, res) => {
    try {
        const { game_id } = req.body;

        if (!game_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu game_id hợp lệ'
            });
        }

        const result = await gamesService.deleteGame(game_id);

        if (!result || !result.success) {
            return res.status(400).json({
                success: false,
                message: 'Xóa game thất bại'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa game thành công'
        });
    }
    catch (error) {
        console.log('Error in deleteGame Controller:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa game'
        });
    }
};

const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file ảnh nào được tải lên'
            });
        }

        const urls = req.files.map(file => `../assets/uploads/games/${file.filename}`);

        return res.status(200).json({
            success: true,
            message: 'Tải ảnh lên thành công',
            data: urls
        });
    } catch (error) {
        console.error('Error in uploadImages Controller:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tải ảnh lên'
        });
    }
};

const addGame = async (req, res) => {
    try {
        const {
            name,
            description,
            publisher,
            developer,
            name_tag,
            release_date,
            download_url,
            image
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên game'
            });
        }

        const game = {
            name: name.trim(),
            description: description ? description.trim() : '',
            publisher: publisher ? publisher.trim() : '',
            developer: developer ? developer.trim() : '',
            name_tag: name_tag ? name_tag.trim() : '',
            release_date: release_date || new Date().toISOString().split('T')[0],
            download_url: download_url ? download_url.trim() : '',
            image: image ? (Array.isArray(image) ? image.join(' ') : image.trim()) : ''
        };

        const result = await gamesService.addGame(game);

        return res.status(200).json({
            success: true,
            message: 'Thêm game thành công',
            data: result.data
        });
    } catch (error) {
        console.log('Error in addGame Controller:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi thêm game'
        });
    }
};

const getCompatibilityPercent = async (req, res) => {
    try {
        const { game_id, cpu_name, gpu_name, ram, storage, os } = req.body;

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const percent = await gamesService.getCompatibilityPercent(
            game_id,
            cpu_name,
            gpu_name,
            ram,
            storage,
            os
        );

        return res.status(200).json({
            success: true,
            percent: percent !== null && percent !== undefined ? parseFloat(percent) : null
        });
    } catch (error) {
        console.log('Error in getCompatibilityPercent Controller: ', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tính phần trăm tương thích'
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await gamesService.getAllCategories();
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};


const getPublishers = async (req, res) => {
    try {
        const publishers = await gamesService.getAllPublishers();
        return res.status(200).json({ success: true, data: publishers });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const updateGameRequirement = async (req, res) => {
    try {
        const { game_id, minimum, recommended } = req.body;

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await gamesService.updateGameRequirement(game_id, minimum, recommended);

        return res.status(200).json({
            success: true,
            message: result.message || 'Cập nhật thông tin cấu hình game thành công'
        });
    } catch (error) {
        console.error('Error in updateGameRequirement Controller:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật cấu hình game'
        });
    }
};

module.exports = {
    getGames,
    getFullGameDetail,
    getGameRequirement,
    checkGameCompatibility,
    getCompatibilityPercent,
    getGameByTag,
    uploadImages,
    addGame,
    deleteGame,
    updateGame,
    updateGameRequirement,
    getCategories,
    getPublishers
};




