const reviewService = require('../service/review.service')

const writeReview = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id } = req.params;
        const { rating, comment } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.writeReview(user_id, game_id, rating, comment);
        if (!result.success) {
            return res.status(400).json({ success: false, message: 'Viết review thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Viết review thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in writeReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi viết review'
        });
    }
}

const updateReview = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id } = req.params;
        const { rating, comment } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.updateReview(user_id, game_id, rating, comment);
        if (!result.success) {
            return res.status(400).json({ success: false, message: 'Cập nhật review thất bại' });
        }

        return res.status(200).json({ success: true, message: 'Cập nhật review thành công' });
    }
    catch (error) {
        console.log('Error in updateReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật review'
        });
    }
}

const getReviews = async (req, res) => {
    try {
        const { game_id } = req.params;
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.getReview(game_id);
        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin review thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in getReviews Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thông tin review'
        });
    }
}

const getAvgRating = async (req, res) => {
    try {
        const { game_id } = req.params;
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.getAvgRating(game_id);
        if (!result) {
            return res.status(400).json({ success: false, message: 'Tính điểm trung bình review của game thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tính điểm trung bình review của game thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in getAvgRating Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi tính điểm trung bình review của game'
        });
    }
}

module.exports = {
    writeReview,
    updateReview,
    getReviews,
    getAvgRating
}